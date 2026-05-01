import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");

const includeNames = new Set(["index.html", "styles.css", "script.js"]);
const imagePattern = /^\d+\.(png|jpg|jpeg|webp|gif|svg)$/i;

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

for (const entry of await readdir(rootDir, { withFileTypes: true })) {
  if (entry.isDirectory()) {
    continue;
  }

  const shouldCopy =
    includeNames.has(entry.name) ||
    imagePattern.test(entry.name);

  if (!shouldCopy) {
    continue;
  }

  await cp(
    path.join(rootDir, entry.name),
    path.join(distDir, entry.name),
    { force: true }
  );
}

console.log("Build complete:", distDir);
