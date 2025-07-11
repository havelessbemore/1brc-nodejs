import { defineConfig, type Options } from "tsup";

import pkg from "./package.json";

const bannerText = `/*! @license ${pkg.name} | ${pkg.license} | ${pkg.homepage} */`;

const baseConfig: Options = {
  banner: { js: bannerText },
  bundle: true,
  clean: true,
  dts: true,
  entryPoints: ["src/index.ts", "src/benchmarks/index.ts"],
  minify: true,
  sourcemap: true,
  splitting: false,
  platform: "neutral",
};

const cjsConfig: Options = {
  name: "CommonJS",
  format: "cjs",
  outDir: "dist/cjs",
};

const esmConfig: Options = {
  name: "ECMAScript",
  format: "esm",
  outDir: "dist/esm",
};

export default defineConfig([
  { ...baseConfig, ...cjsConfig },
  { ...baseConfig, ...esmConfig },
]);
