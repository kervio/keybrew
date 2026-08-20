import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const banner = `/*! Keybrew v${packageJson.version} | MIT License */\n`;

const builds = [
  {
    input: "keybrew.js",
    output: "dist/keybrew.min.js",
    loader: "js",
    options: { target: "es2019" }
  },
  {
    input: "keybrew.css",
    output: "dist/keybrew.min.css",
    loader: "css",
    options: { target: ["chrome90", "edge90", "firefox90", "safari15"] }
  }
];

let stale = false;

for (const build of builds) {
  const source = await readFile(resolve(root, build.input), "utf8");
  const result = await transform(source, {
    loader: build.loader,
    minify: true,
    legalComments: "none",
    charset: "utf8",
    ...build.options
  });
  const generated = `${banner}${result.code.trim()}\n`;
  const outputPath = resolve(root, build.output);

  if (checkOnly) {
    let existing = "";
    try {
      existing = await readFile(outputPath, "utf8");
    } catch {
      // Report the missing artifact with the same stale-build message below.
    }
    if (existing !== generated) {
      console.error(`${build.output} is stale. Run npm run build.`);
      stale = true;
    }
  } else {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, generated, "utf8");
    console.log(`Built ${build.output}`);
  }
}

if (stale) process.exitCode = 1;
