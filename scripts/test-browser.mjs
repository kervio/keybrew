import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const profile = mkdtempSync(join(tmpdir(), "keybrew-browser-"));

function pathCommands(command) {
  return (process.env.PATH || "")
    .split(delimiter)
    .filter(Boolean)
    .map(directory => join(directory, process.platform === "win32" ? `${command}.exe` : command));
}

const candidates = process.platform === "win32"
  ? [
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      ...pathCommands("msedge"),
      ...pathCommands("chrome")
    ]
  : process.platform === "darwin"
    ? [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ...pathCommands("google-chrome"),
        ...pathCommands("chromium")
      ]
    : [
        ...pathCommands("google-chrome"),
        ...pathCommands("google-chrome-stable"),
        ...pathCommands("chromium"),
        ...pathCommands("chromium-browser"),
        "/usr/bin/google-chrome",
        "/usr/bin/chromium"
      ];

const browser = candidates.find(existsSync);
if (!browser) {
  console.error("No Chromium-based browser found. Install Chrome, Edge, or Chromium to run browser tests.");
  process.exit(1);
}

try {
  for (const build of ["source", "minified"]) {
    const url = new URL(pathToFileURL(resolve(root, "test/browser-test.html")));
    url.searchParams.set("build", build);
    const run = spawnSync(browser, [
      "--headless=new",
      "--disable-gpu",
      "--disable-default-apps",
      "--no-first-run",
      `--user-data-dir=${profile}`,
      "--virtual-time-budget=1500",
      "--dump-dom",
      url.href
    ], {
      encoding: "utf8",
      timeout: 25000,
      windowsHide: true
    });

    const output = run.stdout || "";
    if (run.error || run.status !== 0 || !output.includes('<body data-test-status="pass"')) {
      console.error(output.match(/<pre id="result">([\s\S]*?)<\/pre>/)?.[1] || run.stderr || run.error || "Unknown browser-test failure");
      process.exit(1);
    }
    console.log(`Browser tests passed (${build}).`);
  }
} finally {
  rmSync(profile, { recursive: true, force: true });
}
