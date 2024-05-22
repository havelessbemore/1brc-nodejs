import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { createWriteStream, createReadStream } from 'node:fs';
import { open } from 'fs/promises';

const MAX_STATIONS = 1e4;
const STATION_NAME_MAX_LEN = 100;
const ENTRY_MAX_LEN = 107;

const CHAR_MINUS = 45;
const CHAR_NEWLINE = 10;
const CHAR_SEMICOLON = 59;
const CHAR_ZERO = 48;
const UTF8_B0_MIN = 32;
const UTF8_B0_2B_MAX = 223;
const UTF8_B0_2B_LEN = UTF8_B0_2B_MAX - UTF8_B0_MIN + 1;

const HIGH_WATER_MARK_MIN = 16384;
const HIGH_WATER_MARK_MAX = 1048576;
const HIGH_WATER_MARK_OUT = 1048576;
const HIGH_WATER_MARK_RATIO = 152e-6;
const CHUNK_SIZE_MIN = HIGH_WATER_MARK_MIN;
const CHAR_ZERO_11 = 11 * CHAR_ZERO;
const CHAR_ZERO_111 = 111 * CHAR_ZERO;

const MIN_WORKERS = 1;
const MAX_WORKERS = 512;

function clamp(value, min, max) {
  return value > min ? value <= max ? value : max : min;
}
async function getFileChunks(filePath, target, maxLineLength, minSize = 0) {
  const file = await open(filePath);
  try {
    const size = (await file.stat()).size;
    const chunkSize = Math.max(minSize, Math.floor(size / target));
    const buffer = Buffer.allocUnsafe(maxLineLength);
    const chunks = [];
    let start = 0;
    for (let end = chunkSize; end < size; end += chunkSize) {
      const res = await file.read(buffer, 0, maxLineLength, end);
      const newline = buffer.indexOf(CHAR_NEWLINE);
      if (newline >= 0 && newline < res.bytesRead) {
        end += newline + 1;
        chunks.push([start, end]);
        start = end;
      }
    }
    if (start < size) {
      chunks.push([start, size]);
    }
    return chunks;
  } finally {
    await file.close();
  }
}
function getHighWaterMark(size) {
  size *= HIGH_WATER_MARK_RATIO;
  size = Math.round(Math.log2(size));
  size = 2 ** size;
  return clamp(size, HIGH_WATER_MARK_MIN, HIGH_WATER_MARK_MAX);
}

const TRIE_NULL = 0;
const MIN_TRIE_SIZE = 524288;
const TRIE_GROWTH_FACTOR = 1.618;
const TRIE_CHILD_IDX_IDX = 0;
const TRIE_CHILD_IDX_MEM = 1;
const TRIE_CHILD_MEM = TRIE_CHILD_IDX_MEM;
const TRIE_RED_ID_IDX = 0;
const TRIE_RED_ID_MEM = 1;
const TRIE_RED_VALUE_IDX_IDX = 1;
const TRIE_RED_VALUE_IDX_MEM = 1;
const TRIE_RED_MEM = TRIE_RED_ID_MEM + TRIE_RED_VALUE_IDX_MEM;
const TRIE_NODE_ID_IDX = 0;
const TRIE_NODE_ID_MEM = 1;
const TRIE_NODE_VALUE_IDX_IDX = 1;
const TRIE_NODE_VALUE_IDX_MEM = 1;
const TRIE_NODE_CHILDREN_IDX = 2;
const TRIE_NODE_CHILDREN_LEN = UTF8_B0_2B_LEN;
const TRIE_NODE_CHILDREN_MEM = TRIE_CHILD_MEM * TRIE_NODE_CHILDREN_LEN;
const TRIE_NODE_MEM = TRIE_NODE_ID_MEM + TRIE_NODE_VALUE_IDX_MEM + TRIE_NODE_CHILDREN_MEM;
const TRIE_SIZE_IDX = 0;
const TRIE_SIZE_MEM = 1;
const TRIE_ROOT_IDX = 1;
const TRIE_ROOT_MEM = TRIE_NODE_MEM;
const TRIE_ID_IDX = TRIE_ROOT_IDX + TRIE_NODE_ID_IDX;
const TRIE_HEADER_MEM = TRIE_SIZE_MEM + TRIE_ROOT_MEM;

function add(trie, key, min, max) {
  let index = TRIE_ROOT_IDX;
  while (min < max) {
    index += TRIE_NODE_CHILDREN_IDX + TRIE_CHILD_MEM * (key[min++] - UTF8_B0_MIN);
    let child = trie[index + TRIE_CHILD_IDX_IDX];
    if (child === TRIE_NULL) {
      child = trie[TRIE_SIZE_IDX];
      if (child + TRIE_NODE_MEM > trie.length) {
        trie = grow(trie, child + TRIE_NODE_MEM);
      }
      trie[TRIE_SIZE_IDX] += TRIE_NODE_MEM;
      trie[index + TRIE_CHILD_IDX_IDX] = child;
      trie[child + TRIE_NODE_ID_IDX] = trie[TRIE_ID_IDX];
    }
    index = child;
  }
  return [trie, index];
}
function createTrie(id = 0, size = MIN_TRIE_SIZE) {
  const minSize = TRIE_HEADER_MEM;
  const trie = new Int32Array(Math.max(minSize, size));
  trie[TRIE_SIZE_IDX] = minSize;
  trie[TRIE_ID_IDX] = id;
  return trie;
}
function grow(trie, minSize = 0) {
  const length = trie[TRIE_SIZE_IDX];
  minSize = Math.max(minSize, Math.ceil(length * TRIE_GROWTH_FACTOR));
  const next = new Int32Array(minSize);
  for (let i = 0; i < length; ++i) {
    next[i] = trie[i];
  }
  return next;
}
function mergeLeft(tries, at, bt, mergeFn) {
  const queue = [
    [at, TRIE_ROOT_IDX, bt, TRIE_ROOT_IDX]
  ];
  do {
    const Q = queue.length;
    for (let q = 0; q < Q; ++q) {
      let [at2, ai, bt2, bi] = queue[q];
      const bvi = tries[bt2][bi + TRIE_NODE_VALUE_IDX_IDX];
      if (bvi !== TRIE_NULL) {
        const avi = tries[at2][ai + TRIE_NODE_VALUE_IDX_IDX];
        if (avi !== TRIE_NULL) {
          mergeFn(avi, bvi);
        } else {
          tries[at2][ai + TRIE_NODE_VALUE_IDX_IDX] = bvi;
        }
      }
      ai += TRIE_NODE_CHILDREN_IDX;
      bi += TRIE_NODE_CHILDREN_IDX;
      const bn = bi + TRIE_NODE_CHILDREN_MEM;
      while (bi < bn) {
        let ri = tries[bt2][bi + TRIE_CHILD_IDX_IDX];
        if (ri === TRIE_NULL) {
          ai += TRIE_CHILD_MEM;
          bi += TRIE_CHILD_MEM;
          continue;
        }
        const rt = tries[bt2][ri + TRIE_NODE_ID_IDX];
        if (bt2 !== rt) {
          ri = tries[bt2][ri + TRIE_RED_VALUE_IDX_IDX];
        }
        let li = tries[at2][ai + TRIE_CHILD_IDX_IDX];
        if (li === TRIE_NULL) {
          li = tries[at2][TRIE_SIZE_IDX];
          if (li + TRIE_RED_MEM > tries[at2].length) {
            tries[at2] = grow(tries[at2], li + TRIE_RED_MEM);
          }
          tries[at2][TRIE_SIZE_IDX] += TRIE_RED_MEM;
          tries[at2][li + TRIE_RED_ID_IDX] = rt;
          tries[at2][li + TRIE_RED_VALUE_IDX_IDX] = ri;
        } else {
          const lt = tries[at2][li + TRIE_NODE_ID_IDX];
          if (at2 !== lt) {
            ai = tries[at2][li + TRIE_RED_VALUE_IDX_IDX];
          }
          queue.push([lt, li, rt, ri]);
        }
        ai += TRIE_CHILD_MEM;
        bi += TRIE_CHILD_MEM;
      }
    }
    queue.splice(0, Q);
  } while (queue.length > 0);
}
function print(tries, key, trieIndex, stream, separator = "", callbackFn) {
  const stack = new Array(key.length + 1);
  stack[0] = [trieIndex, TRIE_ROOT_IDX + TRIE_NODE_CHILDREN_IDX, 0];
  let top = 0;
  let tail = false;
  do {
    let [trieI, childPtr, numChild] = stack[top];
    if (numChild >= TRIE_NODE_CHILDREN_LEN) {
      --top;
      continue;
    }
    stack[top][1] += TRIE_CHILD_MEM;
    ++stack[top][2];
    let childI = tries[trieI][childPtr + TRIE_CHILD_IDX_IDX];
    if (childI === TRIE_NULL) {
      continue;
    }
    const childTrieI = tries[trieI][childI + TRIE_NODE_ID_IDX];
    if (trieI !== childTrieI) {
      childI = tries[trieI][childI + TRIE_RED_VALUE_IDX_IDX];
      trieI = childTrieI;
    }
    key[top] = numChild + UTF8_B0_MIN;
    stack[++top] = [trieI, childI + TRIE_NODE_CHILDREN_IDX, 0];
    const valueIndex = tries[trieI][childI + TRIE_NODE_VALUE_IDX_IDX];
    if (valueIndex !== TRIE_NULL) {
      if (tail) {
        stream.write(separator);
      }
      tail = true;
      callbackFn(stream, key, top, valueIndex);
    }
  } while (top >= 0);
}

async function run$1(filePath, workerPath, maxWorkers, outPath = "") {
  maxWorkers = clamp(maxWorkers, MIN_WORKERS, MAX_WORKERS);
  const chunks = await getFileChunks(
    filePath,
    maxWorkers,
    ENTRY_MAX_LEN,
    CHUNK_SIZE_MIN
  );
  maxWorkers = chunks.length;
  const numVals = MAX_STATIONS * maxWorkers + 1;
  const counts = new Uint32Array(
    new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * numVals)
  );
  const minmaxes = new Int16Array(
    new SharedArrayBuffer(2 * Int16Array.BYTES_PER_ELEMENT * numVals)
  );
  const sums = new Float64Array(
    new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * numVals)
  );
  const tries = new Array(maxWorkers);
  const workers = new Array(maxWorkers);
  for (let i = 0; i < maxWorkers; ++i) {
    const worker = new Worker(workerPath);
    worker.on("error", (err) => {
      throw err;
    });
    worker.on("messageerror", (err) => {
      throw err;
    });
    worker.on("exit", (code) => {
      if (code > 1 || code < 0) {
        throw new Error(`Worker ${worker.threadId} exited with code ${code}`);
      }
    });
    workers[i] = worker;
  }
  const tasks = new Array(maxWorkers);
  for (let i = 0; i < maxWorkers; ++i) {
    const id = i;
    const worker = workers[i];
    const [start, end] = chunks[i];
    tasks[i] = new Promise((resolve) => {
      worker.once("message", resolve);
      worker.postMessage({
        counts,
        end,
        filePath,
        id,
        minmaxes,
        start,
        sums
      });
    });
  }
  for await (const res of tasks) {
    tries[res.id] = res.trie;
  }
  for (let i = 0; i < maxWorkers; ++i) {
    await workers[i].terminate();
  }
  for (let i = 1; i < maxWorkers; ++i) {
    mergeLeft(tries, 0, i, mergeStations);
  }
  const out = createWriteStream(outPath, {
    fd: outPath.length < 1 ? 1 : void 0,
    flags: "a",
    highWaterMark: HIGH_WATER_MARK_OUT
  });
  const buffer = Buffer.allocUnsafe(STATION_NAME_MAX_LEN);
  out.write("{");
  print(tries, buffer, 0, out, ", ", printStation);
  out.end("}\n");
  function mergeStations(ai, bi) {
    counts[ai] += counts[bi];
    sums[ai] += sums[bi];
    ai <<= 1;
    bi <<= 1;
    minmaxes[ai] = Math.min(minmaxes[ai], minmaxes[bi]);
    minmaxes[ai + 1] = Math.max(minmaxes[ai + 1], minmaxes[bi + 1]);
  }
  function printStation(stream, name, nameLen, vi) {
    const avg = Math.round(sums[vi] / counts[vi]);
    vi <<= 1;
    stream.write(name.toString("utf8", 0, nameLen));
    stream.write("=");
    stream.write((minmaxes[vi] / 10).toFixed(1));
    stream.write("/");
    stream.write((avg / 10).toFixed(1));
    stream.write("/");
    stream.write((minmaxes[vi + 1] / 10).toFixed(1));
  }
}

async function run({
  end,
  filePath,
  id,
  start,
  // Shared memory
  counts,
  minmaxes,
  sums
}) {
  if (start >= end) {
    return { id, trie: createTrie(id, 0) };
  }
  let trie = createTrie(id);
  let stations = id * MAX_STATIONS + 1;
  const buffer = Buffer.allocUnsafe(ENTRY_MAX_LEN);
  const stream = createReadStream(filePath, {
    start,
    end: end - 1,
    highWaterMark: getHighWaterMark(end - start)
  });
  let bufI = 0;
  let tempI = 0;
  let leaf;
  for await (const chunk of stream) {
    const N = chunk.length;
    for (let i = 0; i < N; ++i) {
      if (chunk[i] === CHAR_SEMICOLON) {
        tempI = bufI;
      } else if (chunk[i] !== CHAR_NEWLINE) {
        buffer[bufI++] = chunk[i];
      } else {
        const tempV = parseDouble(buffer, tempI, bufI);
        bufI = 0;
        [trie, leaf] = add(trie, buffer, 0, tempI);
        if (trie[leaf + TRIE_NODE_VALUE_IDX_IDX] !== TRIE_NULL) {
          updateStation(trie[leaf + TRIE_NODE_VALUE_IDX_IDX], tempV);
        } else {
          trie[leaf + TRIE_NODE_VALUE_IDX_IDX] = stations;
          newStation(stations++, tempV);
        }
      }
    }
  }
  function newStation(index, temp) {
    counts[index] = 1;
    sums[index] = temp;
    index <<= 1;
    minmaxes[index] = temp;
    minmaxes[index + 1] = temp;
  }
  function updateStation(index, temp) {
    ++counts[index];
    sums[index] += temp;
    index <<= 1;
    minmaxes[index] = minmaxes[index] <= temp ? minmaxes[index] : temp;
    ++index;
    minmaxes[index] = minmaxes[index] >= temp ? minmaxes[index] : temp;
  }
  return { id, trie };
}
function parseDouble(b, min, max) {
  if (b[min] === CHAR_MINUS) {
    ++min;
    return min + 4 > max ? -(10 * b[min] + b[min + 2] - CHAR_ZERO_11) : -(100 * b[min] + 10 * b[min + 1] + b[min + 3] - CHAR_ZERO_111);
  }
  return min + 4 > max ? 10 * b[min] + b[min + 2] - CHAR_ZERO_11 : 100 * b[min] + 10 * b[min + 1] + b[min + 3] - CHAR_ZERO_111;
}

if (isMainThread) {
  const workerPath = fileURLToPath(import.meta.url);
  run$1(process.argv[2], workerPath, availableParallelism());
} else {
  parentPort.addListener("message", async (req) => {
    const res = await run(req);
    parentPort.postMessage(res, [res.trie.buffer]);
  });
}
//# sourceMappingURL=index.mjs.map
