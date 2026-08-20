# Contributing

Thanks for helping improve Keybrew.

## Development

Requirements: Node.js 18 or newer, npm, and Chrome, Edge, or Chromium for integration tests.

```sh
npm ci
npm run build
npm run validate
```

Commit changes to the readable source files (`keybrew.js` and `keybrew.css`) and regenerate `dist/` with `npm run build`. Do not edit minified files directly.

Please keep runtime dependencies at zero, preserve the focused Hebrew-only scope, and add coverage for behavior changes. Accessibility changes should be checked with keyboard-only navigation and at least one screen reader when practical.

## Pull requests

- Describe the user-facing behavior and compatibility impact.
- Add or update tests and documentation.
- Run `npm run validate` before opening the pull request.
- Do not include secrets, generated test screenshots, or unrelated formatting changes.
