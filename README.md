# Keybrew

A small, dependency-free Hebrew virtual keyboard for plain HTML, JavaScript, and CSS.

Keybrew uses one keyboard for any number of inputs, writes at the caret or selected range, emits native input events, and can float beside the active field or render inline. The default layout contains only Hebrew letters, final forms, geresh/gershayim, Space, and Backspace. Niqqud, number, and symbol panels are opt-in.

## Quick start

```html
<link rel="stylesheet" href="keybrew.css">

<label for="hebrew-name">Hebrew name</label>
<input id="hebrew-name" data-keybrew dir="rtl">

<script src="keybrew.js"></script>
<script>
  const keyboard = Keybrew.auto();
</script>
```

The defaults are a floating keyboard, automatic above/below placement, gentle scrolling when neither side has enough room, both mobile and desktop support, and `inputmode="none"` while attached to discourage a phone's native keyboard.

`inputmode="none"` is a browser hint. Current mobile browsers generally honor it, but a browser or assistive technology may still show its own input UI.

### Distribution files

- `keybrew.js` and `keybrew.css`: readable browser files.
- `dist/keybrew.min.js` and `dist/keybrew.min.css`: minified production/CDN files.
- `keybrew.mjs`: ES module wrapper.

The minified files are committed for direct browser use and are reproducibly generated with `npm run build`. Package consumers still receive zero runtime dependencies; esbuild is development-only.

### ES modules

```js
import Keybrew from "keybrew";
import "keybrew/keybrew.css";

const keyboard = new Keybrew(".hebrew-field", {
  includeNiqqud: true,
  includeNumbers: true,
  includeSymbols: true
});
```

## Common configurations

Mobile only:

```js
new Keybrew("[data-keybrew]", {
  enabledOn: "mobile"
});
```

Allow the native mobile keyboard as well:

```js
new Keybrew("[data-keybrew]", {
  suppressNativeKeyboard: false
});
```

Open only from an optional keyboard-icon button while leaving the native keyboard available at other times:

```html
<div class="input-with-keyboard-action" dir="rtl">
  <input id="hebrew-name">
  <button
    id="hebrew-keyboard-trigger"
    type="button"
    aria-label="Open Hebrew keyboard"
    aria-expanded="false"
  >
    <!-- Your keyboard icon -->
  </button>
</div>
```

```js
const input = document.querySelector("#hebrew-name");
const trigger = document.querySelector("#hebrew-keyboard-trigger");

const keyboard = new Keybrew(input, {
  openOn: "manual",
  suppressNativeKeyboard: "while-open",
  onOpen() {
    trigger.setAttribute("aria-expanded", "true");
  },
  onClose() {
    trigger.setAttribute("aria-expanded", "false");
  }
});

trigger.setAttribute("aria-controls", keyboard.id);
trigger.addEventListener("click", () => keyboard.toggle(input));
```

With this combination, focusing the field normally does not open Keybrew. Clicking the trigger opens it and temporarily applies `inputmode="none"`; closing restores the field's original input mode. Escape and the optional close button return focus to the trigger when it initiated the open.

Inline after the active field:

```js
new Keybrew("#hebrew-name", {
  position: "inline"
});
```

For a stable inline location, provide a container:

```js
new Keybrew(".hebrew-field", {
  position: "inline",
  inlineContainer: "#keyboard-slot"
});
```

Fields inserted later, such as modal contents:

```js
const keyboard = new Keybrew("[data-keybrew]", {
  observe: true
});

// Or attach explicitly:
keyboard.attach(document.querySelector("#modal-hebrew-name"));
```

## Options

| Option | Default | Purpose |
|---|---:|---|
| `enabledOn` | `"both"` | `"mobile"`, `"desktop"`, or `"both"`. |
| `suppressNativeKeyboard` | `true` | `true` always suppresses native input, `false` never does, and `"while-open"` suppresses it only while Keybrew is visible. |
| `openOn` | `"focus"` | `"focus"` opens from field focus/click; `"manual"` opens only through `open()` or `toggle()`. |
| `position` | `"floating"` | `"floating"` or `"inline"`. |
| `placement` | `"auto"` | `"auto"`, `"below"`, or `"above"`. Auto prefers below, flips above when it fits, then scrolls if needed. |
| `align` | `"center"` | Aligns a floating keyboard `"left"`, `"center"`, or `"right"` relative to its field. |
| `gap` | `8` | Pixels between a floating keyboard and its field. |
| `viewportPadding` | `8` | Minimum edge clearance in pixels. |
| `minWidth` | `300` | Preferred minimum floating width, constrained by the viewport. |
| `maxWidth` | `440` | Maximum floating width. |
| `scrollIntoView` | `true` | Scrolls just enough when the keyboard cannot fit. |
| `scrollBehavior` | `"smooth"` | `"smooth"` or `"auto"`; reduced-motion preferences always use auto. |
| `setDirection` | `true` | Adds `dir="rtl"` only when the field has no explicit direction. |
| `includeNiqqud` | `false` | Enables the compact niqqud panel. |
| `includeNumbers` | `false` | Enables numbers. |
| `numbersPlacement` | `"panel"` | Uses a separate `"panel"` or keeps digits visible in a `"top-row"`. |
| `includeSymbols` | `false` | Enables the symbol panel. |
| `showCloseButton` | `false` | Adds an × button. With top-row numbers, it shares the number row. |
| `observe` | `false` | Attaches matching fields added to the DOM later. |
| `inlineContainer` | `null` | Element, selector, or callback returning an inline host. |
| `deviceMatcher` | built in | Callback returning `true` for mobile; useful for kiosks or hybrid hardware. |
| `labels` | English defaults | Overrides interface and assistive labels. |
| `keyLabels` | `{}` | Overrides any key's accessible name. |

The built-in mobile check treats coarse-pointer devices and compact touch devices as mobile, so tablets are included. `deviceMatcher(window)` can override that decision.

## Callbacks and events

```js
const keyboard = new Keybrew("#hebrew-name", {
  onInput(value, detail) {
    console.log(value, detail.inputType);
  },
  onOpen(input) {},
  onClose(input, detail) {},
  onKeyPress(key, detail) {},
  onLayoutChange(layout, detail) {}
});
```

Each field also emits bubbling custom events:

- `keybrew:open`
- `keybrew:close`
- `keybrew:input`
- `keybrew:keypress`
- `keybrew:layoutchange`

Key edits dispatch cancelable `beforeinput` and then bubbling native `input`, so standard form code and most frameworks see the change. Cancel `beforeinput` to reject an edit. Keybrew respects `maxlength`, selections, disabled fields, and readonly fields.

## API

```js
keyboard.open(input);
keyboard.close();
keyboard.toggle(input);
keyboard.attach(inputOrSelector);
keyboard.detach(inputOrSelector);
keyboard.setOptions({ position: "inline" });
keyboard.getActiveInput();
keyboard.isOpen();
keyboard.destroy();
```

Keep a number row above the Hebrew keys and optionally include a close button:

```js
keyboard.setOptions({
  includeNumbers: true,
  numbersPlacement: "top-row",
  showCloseButton: true
});
```

`destroy()` removes all listeners, removes the keyboard, and restores the original `inputmode`, `dir`, and ARIA attributes on every attached field.

## Theming

Keybrew ships with a restrained, neutral default palette. Override tokens on `.keybrew` without targeting internals:

```css
.keybrew {
  --keybrew-primary: #2e77d1;
  --keybrew-primary-dark: #0a1a2e;
  --keybrew-accent: #da6648;
  --keybrew-surface: #fff;
  --keybrew-surface-muted: #f4f5f5;
  --keybrew-text: #121416;
  --keybrew-muted-text: #697077;
  --keybrew-border: #e4e6e7;
  --keybrew-radius: 10px;
  --keybrew-key-radius: 6px;
  --keybrew-shadow-sm: 0 1px 2px rgb(15 23 42 / 0.05);
  --keybrew-shadow-lg: 0 18px 42px -14px rgb(15 23 42 / 0.24);
  --keybrew-key-height: 44px;
  --keybrew-gap: 5px;
}
```

## Accessibility

- Every key is a native `button` with an accessible name.
- Attached fields expose `aria-haspopup`, `aria-controls`, and `aria-expanded`.
- Escape closes the keyboard. When enabled, the close control also returns focus to the field.
- Tab reaches every control; arrow keys move through rows; Home and End move within a row.
- Focus indicators, forced-color mode, touch target sizing, and reduced-motion preferences are supported.
- The keyboard never inserts invisible bidi control characters into submitted values.

## Scope compared with simple-keyboard

Keybrew retains the parts that matter for a Hebrew field: caret-aware editing, reusable multi-input attachment, native events, configurable labels/layout panels, responsive placement, callbacks, physical-input coexistence, and cleanup.

It deliberately omits multilingual layouts, IME candidate boxes, synchronized keyboard instances, arbitrary layout parsing, debug machinery, and per-button theme rule APIs. Those are useful in a general keyboard framework, but unnecessary weight for this package's focused job.

## Publishing to npm

Before the first release, create an npm account, enable two-factor authentication, and run from this directory:

```sh
npm login
npm whoami
npm run check
npm run pack:check
npm publish
```

`keybrew` is an unscoped public package, so plain `npm publish` is sufficient. If the name is no longer available, change the package name to `@your-npm-username/keybrew` and publish with `npm publish --access public`.

The `prepublishOnly` hook reruns the checks before every direct publish. For later releases, update the version first—for example, `npm version patch`—because npm never permits reusing a published name/version pair.

After the first manual release, consider configuring npm trusted publishing with GitHub Actions. It avoids storing an npm token in GitHub and automatically attaches provenance for eligible public repositories.

## GitHub setup

The repository includes CI for supported Node versions, source and minified browser tests, Dependabot configuration, an issue form, a pull-request template, contribution guidance, and a private security-reporting policy.

The project repository is [github.com/kervio/keybrew](https://github.com/kervio/keybrew). Clone it with:

```sh
git clone https://github.com/kervio/keybrew.git
```

## License

MIT
