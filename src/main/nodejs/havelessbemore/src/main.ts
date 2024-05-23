import { WriteStream, createWriteStream } from "node:fs";
import { Worker } from "node:worker_threads";

import type { ProcessRequest } from "./types/processRequest";
import type { ProcessResponse } from "./types/processResponse";

import {
  ENTRY_MAX_LEN,
  MAX_STATIONS,
  STATION_NAME_MAX_LEN,
} from "./constants/constraints";
import { CHUNK_SIZE_MIN, HIGH_WATER_MARK_OUT } from "./constants/stream";
import { MAX_WORKERS, MIN_WORKERS } from "./constants/workers";
import { clamp, getFileChunks } from "./utils/stream";
import { print } from "./utils/utf8Trie";
import { MergeResponse } from "./types/mergeResponse";
import { MergeRequest } from "./types/mergeRequest";
import { createWorker, exec } from "./utils/worker";

export async function run(
  filePath: string,
  workerPath: string,
  maxWorkers: number,
  outPath = "",
): Promise<void> {
  // Sanitize number of workers
  maxWorkers = clamp(maxWorkers, MIN_WORKERS, MAX_WORKERS);

  // Split the file into chunks. Creates 1 or fewer chunks per worker
  const chunks = await getFileChunks(
    filePath,
    maxWorkers,
    ENTRY_MAX_LEN,
    CHUNK_SIZE_MIN,
  );

  // Adjust the number of workers to the number of chunks
  maxWorkers = chunks.length;

  // Initialize data
  const valBuf = new SharedArrayBuffer((MAX_STATIONS * maxWorkers + 1) << 4);
  const mins = new Int16Array(valBuf);
  const maxes = new Int16Array(valBuf, 2);
  const counts = new Uint32Array(valBuf, 4);
  const sums = new Float64Array(valBuf, 8);
  const tries = new Array<Int32Array>(maxWorkers);

  // Create workers
  const workers = new Array<Worker>(maxWorkers);
  for (let i = 0; i < maxWorkers; ++i) {
    workers[i] = createWorker(workerPath);
  }

  // Process each chunk
  const tasks = new Array<Promise<unknown>>(maxWorkers);
  for (let i = 0; i < maxWorkers; ++i) {
    tasks[i] = exec<ProcessRequest, ProcessResponse>(workers[i], {
      type: "process_request",
      counts,
      end: chunks[i][1],
      filePath,
      id: i,
      maxes,
      mins,
      start: chunks[i][0],
      sums,
    }).then((res) => {
      tries[res.id] = res.trie;
    });
  }

  // Merge tries
  for (let i = tasks.length - 1; i > 0; --i) {
    const a = (i - 1) >> 1;
    const b = i;
    tasks[a] = tasks[a]
      .then(() => tasks[b])
      .then(() =>
        exec<MergeRequest, MergeResponse>(workers[a], {
          type: "merge_request",
          a,
          b,
          counts,
          maxes,
          mins,
          sums,
          tries,
        }),
      )
      .then((res) => {
        tries[res.id] = res.trie;
      });
  }

  // Terminate workers
  for (let i = 0; i < maxWorkers; ++i) {
    tasks[i] = tasks[i].then(() => workers[i].terminate());
  }

  // Wait for completion
  await Promise.all(tasks);

  // Print results
  const out = createWriteStream(outPath, {
    fd: outPath.length < 1 ? 1 : undefined,
    flags: "a",
    highWaterMark: HIGH_WATER_MARK_OUT,
  });
  const buffer = Buffer.allocUnsafe(STATION_NAME_MAX_LEN);
  out.write("{");
  print(tries, buffer, 0, out, ", ", printStation);
  out.end("}\n");

  function printStation(
    stream: WriteStream,
    name: Buffer,
    nameLen: number,
    vi: number,
  ): void {
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
