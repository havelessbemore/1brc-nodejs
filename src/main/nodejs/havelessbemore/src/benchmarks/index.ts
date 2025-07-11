import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { Bench, Task } from "tinybench";

import { run } from "../main";

// INPUT
const filePath = process.argv[2];
const maxWorkers = os.availableParallelism();
const workerPath = path.resolve(__filename, "../../index.cjs");

// OUTPUT
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "1brc-"));

main();
async function main(): Promise<void> {
  // BENCHMARK
  let i = 0;
  let t0 = 0;
  const bench = new Bench({ iterations: 5, warmupIterations: 3 });
  bench.add(
    `1BRC`,
    async () => {
      const outPath = path.join(dir, `out_${i}.txt`);
      return run(filePath, workerPath, maxWorkers, outPath);
    },
    {
      beforeAll: () => {
        if (i == 0) {
          t0 = performance.now();
        }
      },
      beforeEach: async function (): Promise<void> {
        if (i > 0) {
          console.log("Waiting 5 seconds...");
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        const elapsed = toSeconds(performance.now() - t0);
        console.log(`${this.name} (${elapsed}s): Running iteration ${++i}...`);
      }
    },
  );

  // Run
  await bench.run();

  // Output
  console.table(bench.tasks.map((task) => toRecord(task)));
  const time = bench.tasks.reduce((sum, t) => sum + t.result!.totalTime, 0);
  process.stdout.write(`Total time: ${toSeconds(time)}s\n`);

  // Cleanup
  fs.rmSync(dir, { recursive: true, force: true });
}

// REPORTING
function toRecord(task: Task): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  out.Name = task.name;
  out["Min (s)"] = toSeconds(task.result?.latency.min);
  out["Max (s)"] = toSeconds(task.result?.latency.max);
  out["Avg (s)"] = toSeconds(task.result?.latency.mean);
  out.Samples = +(task.result?.latency.samples ?? []).length;
  return out;
}

function toSeconds(ms: number | undefined): number {
  return Math.floor(ms ?? 0) / 1000;
}
