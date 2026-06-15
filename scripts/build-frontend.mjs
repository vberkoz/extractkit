import { mkdir, cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { build } from "esbuild";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const rootDir = resolve(scriptDir, "..");
const outDir = resolve(rootDir, "dist/frontend");

await mkdir(outDir, { recursive: true });

await build({
  entryPoints: [resolve(rootDir, "frontend/src/index.ts")],
  outfile: resolve(outDir, "app.js"),
  bundle: true,
  format: "esm",
  target: "es2022",
  sourcemap: true
});

await cp(resolve(rootDir, "frontend/index.html"), resolve(outDir, "index.html"));
await cp(resolve(rootDir, "frontend/styles.css"), resolve(outDir, "styles.css"));
