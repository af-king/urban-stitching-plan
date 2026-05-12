import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const htmlPath = path.join(rootDir, "index.html");
const assetUrlPattern = /https:\/\/www\.figma\.com\/api\/mcp\/asset\/[^"' )]+/g;
const numberedImagePattern = /^(\d+)\.(png|jpg|jpeg|webp|gif|svg)$/i;

const contentTypeToExtension = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/svg+xml", "svg"],
]);

function getExtensionFromContentType(contentType) {
  if (!contentType) {
    return "png";
  }

  const [mimeType] = contentType.split(";");
  return contentTypeToExtension.get(mimeType.trim().toLowerCase()) ?? "png";
}

const html = await readFile(htmlPath, "utf8");
const urls = [...new Set(html.match(assetUrlPattern) ?? [])];

if (urls.length === 0) {
  console.log("No Figma asset URLs found.");
  process.exit(0);
}

const entries = await readdir(rootDir, { withFileTypes: true });
const existingNumbers = entries
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name.match(numberedImagePattern))
  .filter(Boolean)
  .map((match) => Number(match[1]));

let nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
let nextHtml = html;

await mkdir(path.join(rootDir, "scripts"), { recursive: true });

for (const url of urls) {
  console.log(`Downloading ${url}`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const extension = getExtensionFromContentType(response.headers.get("content-type"));
  const fileName = `${nextNumber}.${extension}`;
  const filePath = path.join(rootDir, fileName);
  const buffer = Buffer.from(await response.arrayBuffer());

  await writeFile(filePath, buffer);

  const fileInfo = await stat(filePath);
  if (fileInfo.size === 0) {
    throw new Error(`Downloaded empty file for ${url}`);
  }

  nextHtml = nextHtml.split(url).join(fileName);
  console.log(`Saved ${fileName}`);
  nextNumber += 1;
}

await writeFile(htmlPath, nextHtml, "utf8");
console.log(`Localized ${urls.length} Figma assets into local files.`);
