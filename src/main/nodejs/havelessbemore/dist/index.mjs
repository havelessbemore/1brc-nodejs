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
var TrieNodeProto = ((TrieNodeProto2) => {
  TrieNodeProto2[TrieNodeProto2["ID_IDX"] = 0] = "ID_IDX";
  TrieNodeProto2[TrieNodeProto2["ID_MEM"] = 1] = "ID_MEM";
  TrieNodeProto2[TrieNodeProto2["VALUE_IDX"] = 1] = "VALUE_IDX";
  TrieNodeProto2[TrieNodeProto2["VALUE_MEM"] = 1] = "VALUE_MEM";
  TrieNodeProto2[TrieNodeProto2["CHILDREN_IDX"] = 2] = "CHILDREN_IDX";
  TrieNodeProto2[TrieNodeProto2["CHILDREN_LEN"] = 216 /* BYTE_SPAN */] = "CHILDREN_LEN";
  TrieNodeProto2[TrieNodeProto2["CHILDREN_MEM"] = 1 /* MEM */ * TrieNodeProto2.CHILDREN_LEN] = "CHILDREN_MEM";
  TrieNodeProto2[TrieNodeProto2["MEM"] = 2 + TrieNodeProto2.CHILDREN_MEM] = "MEM";
  return TrieNodeProto2;
})(TrieNodeProto || {});
var TrieProto = ((TrieProto2) => {
  TrieProto2[TrieProto2["SIZE_IDX"] = 0] = "SIZE_IDX";
  TrieProto2[TrieProto2["SIZE_MEM"] = 1] = "SIZE_MEM";
  TrieProto2[TrieProto2["ROOT_IDX"] = 1] = "ROOT_IDX";
  TrieProto2[TrieProto2["ROOT_MEM"] = TrieNodeProto.MEM] = "ROOT_MEM";
  TrieProto2[TrieProto2["ID_IDX"] = 1] = "ID_IDX";
  TrieProto2[TrieProto2["MEM"] = 1 /* SIZE_MEM */ + TrieProto2.ROOT_MEM] = "MEM";
  return TrieProto2;
})(TrieProto || {});

// src/utils/utf8Trie.ts
function add(trie, key, min, max) {
  let index = 1 /* ROOT_IDX */;
  while (min < max) {
    index += 2 /* CHILDREN_IDX */ + 1 /* MEM */ * (key[min++] - 32 /* BYTE_MIN */);
    let child = trie[index + 0 /* IDX_IDX */];
    if (child === 0 /* NULL */) {
      child = trie[0 /* SIZE_IDX */];
      if (child + TrieNodeProto.MEM > trie.length) {
        trie = grow(trie, child + TrieNodeProto.MEM);
      }
      trie[0 /* SIZE_IDX */] += TrieNodeProto.MEM;
      trie[index + 0 /* IDX_IDX */] = child;
      trie[child + 0 /* ID_IDX */] = trie[1 /* ID_IDX */];
    }
    index = child;
  }
  return [trie, index];
}
function createTrie(id = 0, size = 655360 /* DEFAULT_SIZE */) {
  size = Math.max(TrieProto.MEM, size);
  const trie = new Int32Array(new SharedArrayBuffer(size << 2));
  trie[0 /* SIZE_IDX */] = TrieProto.MEM;
  trie[1 /* ID_IDX */] = id;
  return trie;
}
function grow(trie, minSize = 0) {
  const length = trie[0 /* SIZE_IDX */];
  minSize = Math.max(minSize, Math.ceil(length * 1.6180339887 /* GROWTH_FACTOR */));
  const next = new Int32Array(new SharedArrayBuffer(minSize << 2));
  for (let i = 0; i < length; ++i) {
    next[i] = trie[i];
  }
  return next;
}
function mergeLeft(tries, at, bt, mergeFn) {
  const grown = /* @__PURE__ */ new Set();
  const queue = [
    [at, 1 /* ROOT_IDX */, bt, 1 /* ROOT_IDX */]
  ];
  do {
    const Q = queue.length;
    for (let q = 0; q < Q; ++q) {
      let [at2, ai, bt2, bi] = queue[q];
      const bvi = tries[bt2][bi + 1 /* VALUE_IDX */];
      if (bvi !== 0 /* NULL */) {
        const avi = tries[at2][ai + 1 /* VALUE_IDX */];
        if (avi !== 0 /* NULL */) {
          mergeFn(avi, bvi);
        } else {
          tries[at2][ai + 1 /* VALUE_IDX */] = bvi;
        }
      }
      ai += 2 /* CHILDREN_IDX */;
      bi += 2 /* CHILDREN_IDX */;
      const bn = bi + TrieNodeProto.CHILDREN_MEM;
      while (bi < bn) {
        let ri = tries[bt2][bi + 0 /* IDX_IDX */];
        if (ri !== 0 /* NULL */) {
          const rt = tries[bt2][ri + 0 /* ID_IDX */];
          if (bt2 !== rt) {
            ri = tries[bt2][ri + 1 /* IDX_IDX */];
          }
          let li = tries[at2][ai + 0 /* IDX_IDX */];
          if (li === 0 /* NULL */) {
            li = tries[at2][0 /* SIZE_IDX */];
            if (li + 2 /* MEM */ > tries[at2].length) {
              tries[at2] = grow(tries[at2], li + 2 /* MEM */);
              grown.add(at2);
            }
            tries[at2][0 /* SIZE_IDX */] += 2 /* MEM */;
            tries[at2][ai + 0 /* IDX_IDX */] = li;
            tries[at2][li + 0 /* ID_IDX */] = rt;
            tries[at2][li + 1 /* IDX_IDX */] = ri;
          } else {
            const lt = tries[at2][li + 0 /* ID_IDX */];
            if (at2 !== lt) {
              li = tries[at2][li + 1 /* IDX_IDX */];
            }
            queue.push([lt, li, rt, ri]);
          }
        }
        ai += 1 /* MEM */;
        bi += 1 /* MEM */;
      }
    }
    queue.splice(0, Q);
  } while (queue.length > 0);
  return Array.from(grown);
}
function print(tries, key, trieIndex, stream, separator = "", callbackFn) {
  const stack = new Array(key.length + 1);
  stack[0] = [trieIndex, 1 /* ROOT_IDX */ + 2 /* CHILDREN_IDX */, 0];
  let top = 0;
  let tail = false;
  do {
    let [trieI, childPtr, numChild] = stack[top];
    if (numChild >= TrieNodeProto.CHILDREN_LEN) {
      --top;
      continue;
    }
    stack[top][1] += 1 /* MEM */;
    ++stack[top][2];
    let childI = tries[trieI][childPtr + 0 /* IDX_IDX */];
    if (childI === 0 /* NULL */) {
      continue;
    }
    const childTrieI = tries[trieI][childI + 0 /* ID_IDX */];
    if (trieI !== childTrieI) {
      childI = tries[trieI][childI + 1 /* IDX_IDX */];
      trieI = childTrieI;
    }
    key[top] = numChild + 32 /* BYTE_MIN */;
    stack[++top] = [trieI, childI + 2 /* CHILDREN_IDX */, 0];
    const valueIndex = tries[trieI][childI + 1 /* VALUE_IDX */];
    if (valueIndex !== 0 /* NULL */) {
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
      if (trie[leaf + 1 /* VALUE_IDX */] !== 0 /* NULL */) {
        updateStation(trie[leaf + 1 /* VALUE_IDX */], tempV);
      } else {
        trie[leaf + 1 /* VALUE_IDX */] = stations;
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
