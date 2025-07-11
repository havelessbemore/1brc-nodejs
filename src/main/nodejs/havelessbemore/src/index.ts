import { availableParallelism } from "node:os";
import { isMainThread, parentPort } from "node:worker_threads";

import type { MergeRequest } from "./types/mergeRequest";
import type { ProcessRequest } from "./types/processRequest";
import { RequestType, type Request } from "./types/request";

import { run as runMain } from "./main";
import { merge, run as runWorker } from "./worker";

if (isMainThread) {
  runMain(process.argv[2], __filename, availableParallelism());
} else {
  parentPort!.addListener("message", (msg: Request) => {
    if (msg.type === RequestType.PROCESS) {
      parentPort!.postMessage(runWorker(msg as ProcessRequest));
    } else if (msg.type === RequestType.MERGE) {
      parentPort!.postMessage(merge(msg as MergeRequest));
    } else {
      throw new Error("Unknown message type");
    }
  });
}
