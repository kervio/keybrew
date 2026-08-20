import { access, readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(!packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0, "Runtime dependencies must remain empty.");
assert(packageJson.sideEffects.includes("./keybrew.css"), "CSS must remain marked as a side effect.");

const requiredFiles = [
  ".gitignore",
  ".gitattributes",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "dist/keybrew.min.js",
  "dist/keybrew.min.css",
  "keybrew.js",
  "keybrew.css",
  "LICENSE",
  "README.md"
];

for (const file of requiredFiles) await access(resolve(root, file));

const artifacts = [
  { source: "keybrew.js", minified: "dist/keybrew.min.js", gzipLimit: 12 * 1024 },
  { source: "keybrew.css", minified: "dist/keybrew.min.css", gzipLimit: 4 * 1024 }
];

for (const artifact of artifacts) {
  const sourceSize = (await stat(resolve(root, artifact.source))).size;
  const minified = await readFile(resolve(root, artifact.minified));
  const gzipSize = gzipSync(minified, { level: 9 }).length;
  assert(minified.length < sourceSize, `${artifact.minified} is not smaller than its source.`);
  assert(gzipSize <= artifact.gzipLimit, `${artifact.minified} exceeds its gzip size budget.`);
  assert(!minified.includes(Buffer.from("sourceMappingURL")), `${artifact.minified} unexpectedly references a source map.`);
  console.log(`${artifact.minified}: ${minified.length} bytes, ${gzipSize} bytes gzip`);
}
