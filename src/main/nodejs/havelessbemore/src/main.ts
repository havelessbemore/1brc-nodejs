import { WriteStream, createWriteStream } from "node:fs";
import { open } from "node:fs/promises";
import { stdout } from "node:process";

import type { MergeRequest } from "./types/mergeRequest";
import type { MergeResponse } from "./types/mergeResponse";
import type { ProcessRequest } from "./types/processRequest";
import type { ProcessResponse } from "./types/processResponse";

import { BRC } from "./constants/brc";
import { Config } from "./constants/config";
import { clamp, getFileChunks } from "./utils/stream";
import { print } from "./utils/utf8Trie";
import { createWorker, exec } from "./utils/worker";
import { RequestType } from "./types/request";

export async function run(
  filePath: string,
  workerPath: string,
  maxWorkers: number,
  outPath = "",
): Promise<void> {
  // Sanitize number of workers
  maxWorkers = clamp(maxWorkers, Config.WORKERS_MIN, Config.WORKERS_MAX);

  // Open the given file
  const file = await open(filePath, "r");

  // Split the file into chunks. Creates 1 or fewer chunks per worker
  const chunks = await getFileChunks(
    file,
    maxWorkers,
    BRC.MAX_ENTRY_LEN,
    Config.HIGH_WATER_MARK_MIN,
  );

  // Adjust the number of workers to the number of chunks
  maxWorkers = chunks.length;

  // Initialize data
  const valBuf = new SharedArrayBuffer(
    (BRC.MAX_STATIONS * maxWorkers + 1) << 4,
  );
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
      type: RequestType.PROCESS,
      counts,
      end: chunks[i][1],
      filePath,
      id: i,
      maxes,
      mins,
      start: chunks[i][0],
      sums,
    }).then(async (res) => {
      // Add result to trie array
      const a = res.id;
      tries[res.id] = res.trie;
      // Merge with other tries
      while (unmerged.length > 0) {
        const res = await exec<MergeRequest, MergeResponse>(worker, {
          type: RequestType.MERGE,
          a,
          b: unmerged.pop()!,
          counts,
          maxes,
          mins,
          sums,
          tries,
        });
        // Update the trie array
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

  // Close the file
  await file.close();

  // Print results
  const out = createWriteStream(outPath, {
    fd: outPath.length < 1 ? stdout.fd : undefined,
    flags: "a",
    highWaterMark: Config.HIGH_WATER_MARK_OUT,
  });
  const buffer = Buffer.allocUnsafe(BRC.MAX_STATION_NAME_LEN);
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
