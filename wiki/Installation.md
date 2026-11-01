# Installation

```bash
npm install --save-dev @mrzr/figma-tokens
# or
pnpm add --save-dev @mrzr/figma-tokens
yarn add --dev @mrzr/figma-tokens
```

Without installing it:

```bash
npx @mrzr/figma-tokens
```

---

## Requirements

| | |
|---|---|
| **Node.js** | 22 or newer. The package declares `"engines": { "node": ">=22" }` because Style Dictionary 5 requires it. |
| **Module type** | ESM. The package has `"type": "module"`; the config file can be `.mjs`, `.js` or `.json`. |
| **Tailwind** | Not a dependency. The generated `tailwind.css` targets v4 and is tested against 4.3.3. `tokens.css` is plain CSS and needs nothing. |

Dependencies installed with it: `style-dictionary` (5.x) and `culori` (4.x). There are no peer dependencies.

---

## What you get

| Entry | Use |
|---|---|
| `figma-tokens` (bin) | The command line, see [[CLI]] |
| `@mrzr/figma-tokens` (import) | `generate`, `write`, `stale`, `defineConfig` and the config helpers, see [[API-Reference]] |

```js
import { defineConfig } from "@mrzr/figma-tokens";
```

Next: [[Quick-Start]].
