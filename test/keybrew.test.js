"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const Keybrew = require("../keybrew.js");
const packageJson = require("../package.json");

test("exports the same class through CommonJS and the browser global", () => {
  assert.equal(typeof Keybrew, "function");
  assert.equal(globalThis.Keybrew, Keybrew);
  assert.equal(Keybrew.version, "1.0.0");
});

test("ships the focused Hebrew layout and optional panels", () => {
  assert.deepEqual(Keybrew.layouts.hebrew[0], ["ק", "ר", "א", "ט", "ו", "ן", "ם", "פ", "'"]);
  assert.equal(Keybrew.layouts.hebrew.flat().length, 29);
  assert.equal(Keybrew.layouts.niqqud.flat().length, 14);
  assert.equal(Keybrew.layouts.numbers.flat().length, 20);
  assert.equal(Keybrew.layouts.symbols.flat().length, 27);
  assert.equal(Object.isFrozen(Keybrew.layouts.hebrew), true);
  assert.equal(Object.isFrozen(Keybrew.layouts.hebrew[0]), true);
  assert.throws(() => Keybrew.layouts.hebrew[0].push("x"), TypeError);
});

test("package metadata keeps runtime installation dependency-free", () => {
  assert.equal(packageJson.name, "keybrew");
  assert.equal(packageJson.version, Keybrew.version);
  assert.deepEqual(packageJson.dependencies, undefined);
  assert.equal(packageJson.repository.url, "git+https://github.com/kervio/keybrew.git");
  assert.equal(packageJson.homepage, "https://github.com/kervio/keybrew#readme");
  assert.equal(packageJson.bugs.url, "https://github.com/kervio/keybrew/issues");
  assert.equal(JSON.stringify(packageJson).includes("YOUR-NAME"), false);
  assert.equal(packageJson.exports["./keybrew.min.js"], "./dist/keybrew.min.js");
  assert.equal(packageJson.exports["./keybrew.min.css"], "./dist/keybrew.min.css");
});

test("identifies coarse-pointer and compact touch devices", () => {
  const coarse = {
    navigator: { maxTouchPoints: 0 },
    matchMedia: query => ({ matches: query === "(pointer: coarse)" })
  };
  const compactTouch = {
    navigator: { maxTouchPoints: 5 },
    matchMedia: query => ({ matches: query === "(max-width: 1024px)" })
  };
  const desktop = {
    navigator: { maxTouchPoints: 0 },
    matchMedia: () => ({ matches: false })
  };

  assert.equal(Keybrew.isTouchFirst(coarse), true);
  assert.equal(Keybrew.isTouchFirst(compactTouch), true);
  assert.equal(Keybrew.isTouchFirst(desktop), false);
});

test("validates public enum options before touching the DOM", () => {
  assert.throws(
    () => new Keybrew([], { enabledOn: "watch" }),
    /enabledOn must be one of/
  );
  assert.throws(
    () => new Keybrew([], { position: "popover" }),
    /position must be one of/
  );
  assert.throws(
    () => new Keybrew([], { openOn: "hover" }),
    /openOn must be one of/
  );
  assert.throws(
    () => new Keybrew([], { suppressNativeKeyboard: "sometimes" }),
    /suppressNativeKeyboard must be/
  );
  assert.throws(
    () => new Keybrew([], { numbersPlacement: "footer" }),
    /numbersPlacement must be one of/
  );
  assert.throws(
    () => new Keybrew([], { showCloseButton: "yes" }),
    /showCloseButton must be true or false/
  );
});

test("ES module wrapper exposes Keybrew", async () => {
  const module = await import("../keybrew.mjs");
  assert.equal(module.default, Keybrew);
  assert.equal(module.Keybrew, Keybrew);
});

test("minified CommonJS/browser build exposes the same public surface", () => {
  const minified = path.resolve(__dirname, "../dist/keybrew.min.js");
  const script = [
    `const Keybrew = require(${JSON.stringify(minified)});`,
    'if (typeof Keybrew !== "function") process.exit(1);',
    'if (globalThis.Keybrew !== Keybrew) process.exit(2);',
    'if (Keybrew.version !== "1.0.0") process.exit(3);',
    'if (Keybrew.layouts.hebrew.flat().length !== 29) process.exit(4);'
  ].join("\n");
  assert.doesNotThrow(() => execFileSync(process.execPath, ["-e", script]));
});
