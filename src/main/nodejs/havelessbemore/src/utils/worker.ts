import { Worker } from "node:worker_threads";

/**
 * Creates a new Worker instance.
 *
 * @param workerPath - The path to the worker script.
 *
 * @returns A new Worker instance.
 */
export function createWorker(workerPath: string): Worker {
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
  return worker;
}

/**
 * Executes a task on a Worker and returns a Promise that resolves with the response.
 *
 * @param worker - The Worker instance to execute the task.
 * @param req - The request to send to the worker.
 *
 * @returns A Promise that resolves with the response from the worker.
 */
export function exec<Req, Res>(worker: Worker, req: Req): Promise<Res> {
  return new Promise<Res>((resolve) => {
    worker.once("message", resolve);
    worker.postMessage(req);
  });
}
