import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { build } from "esbuild";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const rootDir = resolve(scriptDir, "../..");
const outDir = resolve(rootDir, "dist/scripts");
const outfile = resolve(outDir, "create-api-key.cjs");

await mkdir(outDir, { recursive: true });

await build({
  entryPoints: [resolve(rootDir, "scripts/dev/create-api-key.ts")],
  outfile,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node20",
  sourcemap: true
});

const exitCode = await new Promise((resolvePromise, rejectPromise) => {
  const child = spawn(process.execPath, [outfile], {
    stdio: "inherit",
    env: process.env
  });

  child.on("exit", (code) => {
    resolvePromise(code ?? 1);
  });

  child.on("error", rejectPromise);
});

if (exitCode !== 0) {
  process.exitCode = exitCode;
}
