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
  const numVals = MAX_STATIONS * maxWorkers + 1;
  const counts = new Uint32Array(
    new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * numVals),
  );
  const minmaxes = new Int16Array(
    new SharedArrayBuffer(2 * Int16Array.BYTES_PER_ELEMENT * numVals),
  );
  const sums = new Float64Array(
    new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * numVals),
  );
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
        minmaxes,
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
    counts[ai] += counts[bi];
    sums[ai] += sums[bi];
    ai <<= 1;
    bi <<= 1;
    minmaxes[ai] = Math.min(minmaxes[ai], minmaxes[bi]);
    minmaxes[ai + 1] = Math.max(minmaxes[ai + 1], minmaxes[bi + 1]);
  }

  function printStation(
    stream: WriteStream,
    name: Buffer,
    nameLen: number,
    vi: number,
  ): void {
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
