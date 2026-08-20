import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporary = mkdtempSync(join(tmpdir(), "keybrew-package-"));
const consumer = join(temporary, "consumer");
const npmExecutable = process.env.npm_execpath
  ? { command: process.execPath, prefix: [process.env.npm_execpath] }
  : { command: process.platform === "win32" ? "npm.cmd" : "npm", prefix: [] };

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: 60000,
    windowsHide: true
  });
  if (result.error || result.status !== 0) {
    throw new Error(result.stderr || result.stdout || result.error || `${command} failed`);
  }
  return result.stdout;
}

function runNpm(args, cwd) {
  return run(npmExecutable.command, [...npmExecutable.prefix, ...args], cwd);
}

try {
  const packOutput = runNpm(["pack", "--json", "--pack-destination", temporary], root);
  const packJson = packOutput.match(/(\[\s*\{[\s\S]*\}\s*\])\s*$/);
  if (!packJson) throw new Error("npm pack did not return package metadata.");
  const packResult = JSON.parse(packJson[1]);
  const tarball = join(temporary, packResult[0].filename);
  if (!existsSync(tarball)) throw new Error("npm pack did not create the expected tarball.");

  await import("node:fs/promises").then(fs => fs.mkdir(consumer));
  writeFileSync(join(consumer, "package.json"), '{"name":"keybrew-consumer","private":true,"type":"module"}\n');
  runNpm(["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball], consumer);

  const installedPackage = JSON.parse(readFileSync(join(consumer, "node_modules/keybrew/package.json"), "utf8"));
  if (installedPackage.dependencies && Object.keys(installedPackage.dependencies).length) {
    throw new Error("Installed Keybrew unexpectedly contains runtime dependencies.");
  }

  const commonJsCheck = [
    'const Keybrew = require("keybrew");',
    'if (Keybrew.version !== "1.0.0") process.exit(1);',
    'if (Keybrew.layouts.hebrew.flat().length !== 29) process.exit(2);',
    'require.resolve("keybrew/keybrew.css");',
    'require.resolve("keybrew/keybrew.min.js");',
    'require.resolve("keybrew/keybrew.min.css");'
  ].join("\n");
  run(process.execPath, ["-e", commonJsCheck], consumer);

  const esmCheck = [
    'import Keybrew, { Keybrew as NamedKeybrew } from "keybrew";',
    'if (Keybrew !== NamedKeybrew) process.exit(1);',
    'if (Keybrew.version !== "1.0.0") process.exit(2);'
  ].join("\n");
  run(process.execPath, ["--input-type=module", "-e", esmCheck], consumer);
  console.log("Packed consumer install passed (CommonJS and ESM).");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
