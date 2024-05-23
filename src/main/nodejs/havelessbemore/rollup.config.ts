import { RollupOptions } from "rollup";
import esbuild from "rollup-plugin-esbuild";

import pkg from "./package.json" with { type: "json" };

function bundle(config: RollupOptions): RollupOptions {
  return {
    ...config,
    input: "src/index.ts",
    external: (id) => !/^[./]/.test(id),
  };
}

export default [
  bundle({
    plugins: [
      esbuild({
        target: "ES2022",
        minify: true,
      }),
    ],
    output: [
      {
        file: pkg.main,
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
      {
        file: pkg.module,
        format: "es",
        sourcemap: true,
        exports: "named",
      },
    ],
  }),
];
