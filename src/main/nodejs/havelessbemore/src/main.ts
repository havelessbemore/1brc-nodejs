import { WriteStream, createWriteStream } from "node:fs";

import type { MergeRequest } from "./types/mergeRequest";
import type { MergeResponse } from "./types/mergeResponse";
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

  // Run
  const unmerged: number[] = [];
  const tasks = new Array<Promise<unknown>>(maxWorkers);
  for (let i = 0; i < maxWorkers; ++i) {
    // Create the worker
    const worker = createWorker(workerPath);
    // Process the chunk
    tasks[i] = exec<ProcessRequest, ProcessResponse>(worker, {
      type: "process",
      counts,
      end: chunks[i][1],
      filePath,
      id: i,
      maxes,
      mins,
      start: chunks[i][0],
      sums,
    }).then(async (res) => {
      // Add the worker's trie
      const a = res.id;
      tries[res.id] = res.trie;
      // Merge with other tries
      while (unmerged.length > 0) {
        const res = await exec<MergeRequest, MergeResponse>(worker, {
          type: "merge",
          a,
          b: unmerged.pop()!,
          counts,
          maxes,
          mins,
          sums,
          tries,
        });
        for (const id of res.ids) {
          tries[id] = res.tries[id];
        }
      }
      unmerged.push(a);
      // Stop worker
      return worker.terminate();
    });
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
  print(tries, buffer, unmerged[0], out, ", ", printStation);
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
