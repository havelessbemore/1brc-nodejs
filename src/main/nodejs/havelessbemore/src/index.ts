import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";
import { isMainThread, parentPort } from "node:worker_threads";

import type { WorkerRequest } from "./types/workerRequest";

import { run as runMain } from "./main";
import { run as runWorker } from "./worker";

if (isMainThread) {
  const workerPath = fileURLToPath(import.meta.url);
  runMain(process.argv[2], workerPath, availableParallelism());
} else {
  parentPort!.addListener("message", async (req: WorkerRequest) => {
    const res = await runWorker(req);
    parentPort!.postMessage(res, [res.trie.buffer]);
  });
}
