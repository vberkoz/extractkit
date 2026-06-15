import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { build } from "esbuild";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const rootDir = resolve(scriptDir, "..");
const outDir = resolve(rootDir, "dist/backend");

await mkdir(outDir, { recursive: true });

await build({
  entryPoints: [resolve(rootDir, "backend/src/handler.ts")],
  outfile: resolve(outDir, "index.js"),
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node20",
  sourcemap: true,
  external: ["aws-sdk"]
});
