import { mkdtemp, rm } from "fs/promises";
import { join, resolve } from "path";
import { stdout } from "process";
import { availableParallelism, tmpdir } from "os";
import { fileURLToPath } from "url";

import { Bench, Task } from "tinybench";

import { run } from "../src/main";

// INPUT
const filePath = process.argv[2];
const maxWorkers = availableParallelism();
const workerPath = resolve(fileURLToPath(import.meta.url), "../../dist/index.mjs");

// OUTPUT
const dir = await mkdtemp(join(tmpdir(), '1brc-'));

// BENCHMARK
let i = 0;
let t0 = 0;
const bench = new Bench({ iterations: 5 });
bench.add(`1BRC`, async () => {
    const outPath = join(dir, `out_${i}.txt`);
    return run(filePath, workerPath, maxWorkers, outPath);
}, {
    beforeAll: () => {
        t0 = performance.now();
    },
    beforeEach: function(): void {
        const elapsed = toSeconds(performance.now() - t0);
        console.log(`${this.name} (${elapsed}s): Running iteration ${++i}...`);
    }
});

await bench.run();

// CLEANUP
await rm(dir, { recursive: true, force: true });

// REPORTING
function toRecord(task: Task): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    out["Name"] = task.name;
    out["Min (s)"] = toSeconds(task.result?.min);
    out["Max (s)"] = toSeconds(task.result?.max);
    out["Avg (s)"] = toSeconds(task.result?.mean);
    out["Samples"] = +(task.result?.samples ?? []).length;
    return out;
}

function toSeconds(ms: number | undefined): number {
    return Math.floor(ms ?? 0) / 1000;
}

console.table(bench.tasks.map(task => toRecord(task)));
const time = bench.tasks.reduce((sum, t) => sum + t.result!.totalTime, 0);
stdout.write(`Total time: ${toSeconds(time)}s\n`);