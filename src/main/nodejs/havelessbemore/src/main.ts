import { WriteStream, createWriteStream } from "node:fs";
import { Worker } from "node:worker_threads";

import type { WorkerRequest } from "./types/workerRequest";
import type { WorkerResponse } from "./types/workerResponse";

import {
  ENTRY_MAX_LEN,
  MAX_STATIONS,
  STATION_NAME_MAX_LEN,
} from "./constants/constraints";
import { CHUNK_SIZE_MIN, HIGH_WATER_MARK_OUT } from "./constants/stream";
import { MAX_WORKERS, MIN_WORKERS } from "./constants/workers";
import { clamp, getFileChunks } from "./utils/stream";
import { mergeLeft, print } from "./utils/utf8Trie";

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
  const BPE =
    // Count
    Uint32Array.BYTES_PER_ELEMENT +
    // Max
    Int16Array.BYTES_PER_ELEMENT +
    // Min
    Int16Array.BYTES_PER_ELEMENT +
    // Sum
    Float64Array.BYTES_PER_ELEMENT;
  const valuesBuffer = new SharedArrayBuffer(
    BPE * (MAX_STATIONS * maxWorkers + 1),
  );
  const mins = new Int16Array(valuesBuffer);
  const maxes = new Int16Array(valuesBuffer, Int16Array.BYTES_PER_ELEMENT);
  const counts = new Uint32Array(valuesBuffer, Uint32Array.BYTES_PER_ELEMENT);
  const sums = new Float64Array(valuesBuffer, Float64Array.BYTES_PER_ELEMENT);
  const tries: Int32Array[] = new Array(maxWorkers);

  // Create workers
  const workers = new Array<Worker>(maxWorkers);
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

  // Process each chunk
  const tasks = new Array<Promise<WorkerResponse>>(maxWorkers);
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
        maxes,
        mins,
        start,
        sums,
      } as WorkerRequest);
    });
  }

  // Wait for completion
  for await (const res of tasks) {
    tries[res.id] = res.trie;
  }

  // Terminate workers
  for (let i = 0; i < maxWorkers; ++i) {
    await workers[i].terminate();
  }

  // Merge tries
  for (let i = 1; i < maxWorkers; ++i) {
    mergeLeft(tries, 0, i, mergeStations);
  }

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

  function mergeStations(ai: number, bi: number): void {
    ai <<= 3;
    bi <<= 3;
    mins[ai] = Math.min(mins[ai], mins[bi]);
    maxes[ai] = Math.max(maxes[ai], maxes[bi]);
    counts[ai >> 1] += counts[bi >> 1];
    sums[ai >> 2] += sums[bi >> 2];
  }

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
