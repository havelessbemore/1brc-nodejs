import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";
import { isMainThread, parentPort } from "node:worker_threads";

import { run as runMain } from "./main";
import { merge, run as runWorker } from "./worker";
import { Request } from "./types/request";
import { ProcessRequest } from "./types/processRequest";
import { MergeRequest } from "./types/mergeRequest";

if (isMainThread) {
  const workerPath = fileURLToPath(import.meta.url);
  runMain(process.argv[2], workerPath, availableParallelism());
} else {
  parentPort!.addListener("message", async (msg: Request) => {
    if (msg.type === "process") {
      parentPort!.postMessage(await runWorker(msg as ProcessRequest));
    } else if (msg.type === "merge") {
      parentPort!.postMessage(merge(msg as MergeRequest));
    } else {
      throw new Error("Unknown message type");
    }
  });
}
