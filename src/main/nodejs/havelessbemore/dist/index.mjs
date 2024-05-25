// src/index.ts
import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";
import { isMainThread, parentPort } from "node:worker_threads";

// src/main.ts
import { createWriteStream } from "node:fs";

// src/utils/stream.ts
import { open } from "fs/promises";
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
      const newline = buffer.indexOf(10 /* NEWLINE */);
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
  size *= 152e-6 /* HIGH_WATER_MARK_RATIO */;
  size = Math.round(Math.log2(size));
  size = 2 ** size;
  return clamp(size, 16384 /* HIGH_WATER_MARK_MIN */, 1048576 /* HIGH_WATER_MARK_MAX */);
}

// src/constants/utf8Trie.ts
var TRIE_DEFAULT_SIZE = 655360;
var TRIE_GROWTH_FACTOR = 1.6180339887;
var TRIE_PTR_IDX_MEM = 1;
var TRIE_PTR_MEM = TRIE_PTR_IDX_MEM;
var TRIE_XPTR_ID_MEM = 1;
var TRIE_XPTR_IDX_IDX = 1;
var TRIE_XPTR_IDX_MEM = 1;
var TRIE_XPTR_MEM = TRIE_XPTR_ID_MEM + TRIE_XPTR_IDX_MEM;
var TRIE_NODE_ID_IDX = 0;
var TRIE_NODE_ID_MEM = 1;
var TRIE_NODE_VALUE_IDX = 1;
var TRIE_NODE_VALUE_MEM = 1;
var TRIE_NODE_CHILDREN_IDX = 2;
var TRIE_NODE_CHILDREN_LEN = 216 /* BYTE_SPAN */;
var TRIE_NODE_CHILDREN_MEM = TRIE_PTR_MEM * TRIE_NODE_CHILDREN_LEN;
var TRIE_NODE_MEM = TRIE_NODE_ID_MEM + TRIE_NODE_VALUE_MEM + TRIE_NODE_CHILDREN_MEM;
var TRIE_NULL = 0;
var TRIE_SIZE_IDX = 0;
var TRIE_SIZE_MEM = 1;
var TRIE_ROOT_IDX = 1;
var TRIE_ROOT_MEM = TRIE_NODE_MEM;
var TRIE_ID_IDX = TRIE_ROOT_IDX + TRIE_NODE_ID_IDX;
var TRIE_MEM = TRIE_SIZE_MEM + TRIE_ROOT_MEM;

// src/utils/utf8Trie.ts
function add(trie, key, min, max) {
  let index = TRIE_ROOT_IDX;
  while (min < max) {
    index += TRIE_NODE_CHILDREN_IDX + /*TRIE_PTR_MEM * */
    (key[min++] - 32 /* BYTE_MIN */);
    let child = trie[
      index
      /*+ TRIE_PTR_IDX_IDX*/
    ];
    if (child === TRIE_NULL) {
      child = trie[TRIE_SIZE_IDX];
      if (child + TRIE_NODE_MEM > trie.length) {
        trie = grow(trie, child + TRIE_NODE_MEM);
      }
      trie[TRIE_SIZE_IDX] += TRIE_NODE_MEM;
      trie[
        index
        /*+ TRIE_PTR_IDX_IDX*/
      ] = child;
      trie[
        child
        /* + TRIE_NODE_ID_IDX*/
      ] = trie[TRIE_ID_IDX];
    }
    index = child;
  }
  return [trie, index];
}
function createTrie(id = 0, size = TRIE_DEFAULT_SIZE) {
  size = Math.max(TRIE_MEM, size);
  const trie = new Int32Array(new SharedArrayBuffer(size << 2));
  trie[TRIE_SIZE_IDX] = TRIE_MEM;
  trie[TRIE_ID_IDX] = id;
  return trie;
}
function grow(trie, minSize = 0) {
  const length = trie[TRIE_SIZE_IDX];
  minSize = Math.max(minSize, Math.ceil(length * TRIE_GROWTH_FACTOR));
  const next = new Int32Array(new SharedArrayBuffer(minSize << 2));
  for (let i = 0; i < length; ++i) {
    next[i] = trie[i];
  }
  return next;
}
function mergeLeft(tries, at, bt, mergeFn) {
  const grown = /* @__PURE__ */ new Set();
  const queue = [
    [at, TRIE_ROOT_IDX, bt, TRIE_ROOT_IDX]
  ];
  do {
    const Q = queue.length;
    for (let q = 0; q < Q; ++q) {
      let [at2, ai, bt2, bi] = queue[q];
      const bvi = tries[bt2][bi + TRIE_NODE_VALUE_IDX];
      if (bvi !== TRIE_NULL) {
        const avi = tries[at2][ai + TRIE_NODE_VALUE_IDX];
        if (avi !== TRIE_NULL) {
          mergeFn(avi, bvi);
        } else {
          tries[at2][ai + TRIE_NODE_VALUE_IDX] = bvi;
        }
      }
      ai += TRIE_NODE_CHILDREN_IDX;
      bi += TRIE_NODE_CHILDREN_IDX;
      const bn = bi + TRIE_NODE_CHILDREN_MEM;
      while (bi < bn) {
        let ri = tries[bt2][
          bi
          /* + TRIE_PTR_IDX_IDX*/
        ];
        if (ri !== TRIE_NULL) {
          const rt = tries[bt2][
            ri
            /*+ TRIE_NODE_ID_IDX*/
          ];
          if (bt2 !== rt) {
            ri = tries[bt2][ri + TRIE_XPTR_IDX_IDX];
          }
          let li = tries[at2][
            ai
            /*+ TRIE_PTR_IDX_IDX*/
          ];
          if (li === TRIE_NULL) {
            li = tries[at2][TRIE_SIZE_IDX];
            if (li + TRIE_XPTR_MEM > tries[at2].length) {
              tries[at2] = grow(tries[at2], li + TRIE_XPTR_MEM);
              grown.add(at2);
            }
            tries[at2][TRIE_SIZE_IDX] += TRIE_XPTR_MEM;
            tries[at2][
              ai
              /*+ TRIE_PTR_IDX_IDX*/
            ] = li;
            tries[at2][
              li
              /* + TRIE_XPTR_ID_IDX*/
            ] = rt;
            tries[at2][li + TRIE_XPTR_IDX_IDX] = ri;
          } else {
            const lt = tries[at2][
              li
              /* + TRIE_NODE_ID_IDX*/
            ];
            if (at2 !== lt) {
              li = tries[at2][li + TRIE_XPTR_IDX_IDX];
            }
            queue.push([lt, li, rt, ri]);
          }
        }
        ai += TRIE_PTR_MEM;
        bi += TRIE_PTR_MEM;
      }
    }
    queue.splice(0, Q);
  } while (queue.length > 0);
  return Array.from(grown);
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
    stack[top][1] += TRIE_PTR_MEM;
    ++stack[top][2];
    let childI = tries[trieI][
      childPtr
      /* + TRIE_PTR_IDX_IDX*/
    ];
    if (childI === TRIE_NULL) {
      continue;
    }
    const childTrieI = tries[trieI][
      childI
      /* + TRIE_NODE_ID_IDX*/
    ];
    if (trieI !== childTrieI) {
      childI = tries[trieI][childI + TRIE_XPTR_IDX_IDX];
      trieI = childTrieI;
    }
    key[top] = numChild + 32 /* BYTE_MIN */;
    stack[++top] = [trieI, childI + TRIE_NODE_CHILDREN_IDX, 0];
    const valueIndex = tries[trieI][childI + TRIE_NODE_VALUE_IDX];
    if (valueIndex !== TRIE_NULL) {
      if (tail) {
        stream.write(separator);
      }
      tail = true;
      callbackFn(stream, key, top, valueIndex);
    }
  } while (top >= 0);
}

// src/utils/worker.ts
import { Worker } from "worker_threads";
function createWorker(workerPath) {
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
  return worker;
}
function exec(worker, req) {
  return new Promise((resolve) => {
    worker.once("message", resolve);
    worker.postMessage(req);
  });
}

// src/main.ts
async function run(filePath, workerPath, maxWorkers, outPath = "") {
  maxWorkers = clamp(maxWorkers, 1 /* WORKERS_MIN */, 512 /* WORKERS_MAX */);
  const chunks = await getFileChunks(
    filePath,
    maxWorkers,
    107 /* MAX_ENTRY_LEN */,
    16384 /* CHUNK_SIZE_MIN */
  );
  maxWorkers = chunks.length;
  const valBuf = new SharedArrayBuffer(
    1e4 /* MAX_STATIONS */ * maxWorkers + 1 << 4
  );
  const mins = new Int16Array(valBuf);
  const maxes = new Int16Array(valBuf, 2);
  const counts = new Uint32Array(valBuf, 4);
  const sums = new Float64Array(valBuf, 8);
  const tries = new Array(maxWorkers);
  const unmerged = [];
  const tasks = new Array(maxWorkers);
  for (let i = 0; i < maxWorkers; ++i) {
    const worker = createWorker(workerPath);
    tasks[i] = exec(worker, {
      type: "process",
      counts,
      end: chunks[i][1],
      filePath,
      id: i,
      maxes,
      mins,
      start: chunks[i][0],
      sums
    }).then(async (res) => {
      const a = res.id;
      tries[res.id] = res.trie;
      while (unmerged.length > 0) {
        const res2 = await exec(worker, {
          type: "merge",
          a,
          b: unmerged.pop(),
          counts,
          maxes,
          mins,
          sums,
          tries
        });
        for (const id of res2.ids) {
          tries[id] = res2.tries[id];
        }
      }
      unmerged.push(a);
      return worker.terminate();
    });
  }
  await Promise.all(tasks);
  const out = createWriteStream(outPath, {
    fd: outPath.length < 1 ? 1 : void 0,
    flags: "a",
    highWaterMark: 1048576 /* HIGH_WATER_MARK_OUT */
  });
  const buffer = Buffer.allocUnsafe(100 /* MAX_STATION_NAME_LEN */);
  out.write("{");
  print(tries, buffer, unmerged[0], out, ", ", printStation);
  out.end("}\n");
  function printStation(stream, name, nameLen, vi) {
    const avg = Math.round(sums[vi << 1] / counts[vi << 2]);
    stream.write(name.toString("utf8", 0, nameLen));
    stream.write("=");
    stream.write((mins[vi << 3] / 10).toFixed(1));
    stream.write("/");
    stream.write((avg / 10).toFixed(1));
    stream.write("/");
    stream.write((maxes[vi << 3] / 10).toFixed(1));
  }
}

// src/worker.ts
import { createReadStream } from "node:fs";

// src/utils/parse.ts
var CHAR_ZERO_11 = 11 * 48 /* ZERO */;
var CHAR_ZERO_111 = 111 * 48 /* ZERO */;
function parseDouble(b, min, max) {
  if (b[min] === 45 /* MINUS */) {
    ++min;
    return min + 4 > max ? CHAR_ZERO_11 - 10 * b[min] - b[min + 2] : CHAR_ZERO_111 - 100 * b[min] - 10 * b[min + 1] - b[min + 3];
  }
  return min + 4 > max ? 10 * b[min] + b[min + 2] - CHAR_ZERO_11 : 100 * b[min] + 10 * b[min + 1] + b[min + 3] - CHAR_ZERO_111;
}

// src/worker.ts
async function run2({
  end,
  filePath,
  id,
  start,
  // Shared memory
  counts,
  maxes,
  mins,
  sums
}) {
  if (start >= end) {
    return { id, trie: createTrie(id, 0) };
  }
  let trie = createTrie(id);
  let stations = id * 1e4 /* MAX_STATIONS */ + 1;
  const buffer = Buffer.allocUnsafe(107 /* MAX_ENTRY_LEN */);
  const stream = createReadStream(filePath, {
    start,
    end: end - 1,
    highWaterMark: getHighWaterMark(end - start)
  });
  let bufI = 0;
  let leaf;
  for await (const chunk of stream) {
    const N = chunk.length;
    for (let i = 0; i < N; ++i) {
      if (chunk[i] !== 10 /* NEWLINE */) {
        buffer[bufI++] = chunk[i];
        continue;
      }
      let semI = bufI - 4;
      if (buffer[semI - 2] === 59 /* SEMICOLON */) {
        semI -= 2;
      } else if (buffer[semI - 1] === 59 /* SEMICOLON */) {
        semI -= 1;
      }
      const tempV = parseDouble(buffer, semI + 1, bufI);
      bufI = 0;
      [trie, leaf] = add(trie, buffer, 0, semI);
      if (trie[leaf + TRIE_NODE_VALUE_IDX] !== TRIE_NULL) {
        updateStation(trie[leaf + TRIE_NODE_VALUE_IDX], tempV);
      } else {
        trie[leaf + TRIE_NODE_VALUE_IDX] = stations;
        newStation(stations++, tempV);
      }
    }
  }
  function newStation(index, temp) {
    mins[index << 3] = temp;
    maxes[index << 3] = temp;
    counts[index << 2] = 1;
    sums[index << 1] = temp;
  }
  function updateStation(index, temp) {
    index <<= 3;
    mins[index] = mins[index] <= temp ? mins[index] : temp;
    maxes[index] = maxes[index] >= temp ? maxes[index] : temp;
    ++counts[index >> 1];
    sums[index >> 2] += temp;
  }
  return { id, trie };
}
function merge({
  a,
  b,
  tries,
  counts,
  maxes,
  mins,
  sums
}) {
  function mergeStations(ai, bi) {
    ai <<= 3;
    bi <<= 3;
    mins[ai] = Math.min(mins[ai], mins[bi]);
    maxes[ai] = Math.max(maxes[ai], maxes[bi]);
    counts[ai >> 1] += counts[bi >> 1];
    sums[ai >> 2] += sums[bi >> 2];
  }
  const ids = mergeLeft(tries, a, b, mergeStations);
  return { ids, tries };
}

// src/index.ts
if (isMainThread) {
  const workerPath = fileURLToPath(import.meta.url);
  run(process.argv[2], workerPath, availableParallelism());
} else {
  parentPort.addListener("message", async (msg) => {
    if (msg.type === "process") {
      parentPort.postMessage(await run2(msg));
    } else if (msg.type === "merge") {
      parentPort.postMessage(merge(msg));
    } else {
      throw new Error("Unknown message type");
    }
  });
}
//# sourceMappingURL=index.mjs.map
