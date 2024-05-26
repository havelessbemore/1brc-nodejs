import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";
import { isMainThread, parentPort } from "node:worker_threads";

import type { MergeRequest } from "./types/mergeRequest";
import type { ProcessRequest } from "./types/processRequest";
import { RequestType, type Request } from "./types/request";

import { run as runMain } from "./main";
import { merge, run as runWorker } from "./worker";

if (isMainThread) {
  const workerPath = fileURLToPath(import.meta.url);
  runMain(process.argv[2], workerPath, availableParallelism());
} else {
  parentPort!.addListener("message", async (msg: Request) => {
    if (msg.type === RequestType.PROCESS) {
      parentPort!.postMessage(await runWorker(msg as ProcessRequest));
    } else if (msg.type === RequestType.MERGE) {
      parentPort!.postMessage(merge(msg as MergeRequest));
    } else {
      throw new Error("Unknown message type");
    }
  });
}
