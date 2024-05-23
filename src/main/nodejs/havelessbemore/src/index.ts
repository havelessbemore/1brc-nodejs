import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";
import { isMainThread, parentPort } from "node:worker_threads";

import { run as runMain } from "./main";
import { merge, run as runWorker } from "./worker";
import { Message } from "./types/message";
import { ProcessRequest } from "./types/processRequest";
import { MergeRequest } from "./types/mergeRequest";

if (isMainThread) {
  const workerPath = fileURLToPath(import.meta.url);
  runMain(process.argv[2], workerPath, availableParallelism());
} else {
  parentPort!.addListener("message", async (msg: Message) => {
    if (msg.type === "process_request") {
      const res = await runWorker(msg as ProcessRequest);
      parentPort!.postMessage(res);
    } else if (msg.type === "merge_request") {
      const res = merge(msg as MergeRequest);
      parentPort!.postMessage(res);
    } else {
      throw new Error("Unknown message type");
    }
  });
}
