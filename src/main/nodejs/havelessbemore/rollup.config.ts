import { RollupOptions } from "rollup";
import esbuild from "rollup-plugin-esbuild";
import license, { Options as LicenseOptions } from "rollup-plugin-license";

import pkg from "./package.json" with { type: "json" };

function bundle(config: RollupOptions): RollupOptions {
  return {
    ...config,
    input: "src/index.ts",
    external: (id) => !/^[./]/.test(id),
  };
}

const licenseConfig: LicenseOptions = {
  sourcemap: true,
  banner: {
    commentStyle: "ignored",
    content: {
      file: "./NOTICE",
    },
  },
};

export default [
  bundle({
    plugins: [
      esbuild({
        target: "ES2022",
        minify: true,
      }),
      license(licenseConfig),
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
