# @mrzr/figma-tokens

[![npm](https://img.shields.io/npm/v/@mrzr/figma-tokens)](https://www.npmjs.com/package/@mrzr/figma-tokens)
[![types](https://img.shields.io/npm/types/@mrzr/figma-tokens)](https://www.npmjs.com/package/@mrzr/figma-tokens)
[![license](https://img.shields.io/npm/l/@mrzr/figma-tokens)](LICENSE)

Turn the design tokens you export from Figma into CSS: one variable per token, plus a Tailwind CSS v4 theme with the light and dark colours paired for you.

**[Wiki](https://github.com/mohammadreza-zr/figma-tokens/wiki)** · [Quick start](https://github.com/mohammadreza-zr/figma-tokens/wiki/Quick-Start) · [Configuration](https://github.com/mohammadreza-zr/figma-tokens/wiki/Configuration) · [Changelog](https://github.com/mohammadreza-zr/figma-tokens/blob/main/CHANGELOG.md)

```bash
npm install --save-dev @mrzr/figma-tokens
npx @mrzr/figma-tokens
```

---

## Is this for you?

**Use it if**

- Your colours, radii, sizes, fonts and durations are variables in Figma, and you export them as JSON
- Your project uses Tailwind CSS v4, or plain CSS variables
- You want light and dark colours wired together without writing the mapping by hand
- You want CI to fail when someone changes the tokens but forgets to regenerate the CSS

**Use something else if not.** It writes CSS only. For iOS, Android or other platforms use [Style Dictionary](https://styledictionary.com) directly (this package is built on it). It does not support Tailwind v3, and it does not call the Figma API: it reads the JSON files you export.

---

## Quick start

Put the exported `*.json` files in a folder and add `figma-tokens.config.mjs` next to your `package.json`:

<!-- verbatim: examples/basic/figma-tokens.config.mjs -->
```js
import { defineConfig } from "@mrzr/figma-tokens";

export default defineConfig({
  input: "tokens",
  outDir: "generated",
  primitives: { keep: ["white", "black"] },
  fontSans: "font-fa-primary",
  aliases: {
    primary: "brand-primary",
    "primary-foreground": "brand-on-primary",
    background: "neutral-background",
    foreground: "neutral-on-background",
    destructive: "status-error",
  },
  extra: "  --radius: var(--radius-md);",
});
```

```bash
npx @mrzr/figma-tokens           # writes generated/tokens.css and generated/tailwind.css
npx @mrzr/figma-tokens --check   # writes nothing; exit code 1 when the files are out of date
```

```css
@import "tailwindcss";
@import "./generated/tokens.css";
@import "./generated/tailwind.css";
```

Now `bg-primary`, `text-primary-foreground`, `rounded-md`, `text-body` and the rest work, and adding the class `dark` to `<html>` switches every semantic colour to its dark value. The full walk-through, with the input and the output side by side, is in the [Quick start](https://github.com/mohammadreza-zr/figma-tokens/wiki/Quick-Start).

---

## What it does

- **`tokens.css`**: every token as a CSS variable on `:root`. Colours become `oklch()`, numbers get `px` or `ms` where that is what they mean, references between tokens stay as `var(--…)`
- **`tailwind.css`**: a Tailwind v4 `@theme inline` registration of the tokens, a `:root` / `.dark` pair for the semantic colours, your short aliases, `text-*` sizes and `duration-*` utilities
- **`--check`**: compares what would be written with what is on disk, for CI
- **A small API**: `generate`, `write` and `stale` if you want to run it from your own script

## What it does not do

It does not read Figma directly, does not support Tailwind v3, and rejects composite tokens (shadows, gradients, typography styles) with an error instead of guessing. Light and dark must be two groups inside the colour collection, not two Figma modes. The [Home](https://github.com/mohammadreza-zr/figma-tokens/wiki) page lists every limit.

---

## Documentation

Everything is in the **[Wiki](https://github.com/mohammadreza-zr/figma-tokens/wiki)**:

- **Start:** [Installation](https://github.com/mohammadreza-zr/figma-tokens/wiki/Installation) · [Quick start](https://github.com/mohammadreza-zr/figma-tokens/wiki/Quick-Start)
- **Guides:** [Input format](https://github.com/mohammadreza-zr/figma-tokens/wiki/Input-Format) · [Conversion rules](https://github.com/mohammadreza-zr/figma-tokens/wiki/Conversion-Rules) · [Tailwind output](https://github.com/mohammadreza-zr/figma-tokens/wiki/Tailwind-Output)
- **Reference:** [Configuration](https://github.com/mohammadreza-zr/figma-tokens/wiki/Configuration) · [CLI](https://github.com/mohammadreza-zr/figma-tokens/wiki/CLI) · [API](https://github.com/mohammadreza-zr/figma-tokens/wiki/API-Reference)
- **Help:** [Troubleshooting](https://github.com/mohammadreza-zr/figma-tokens/wiki/Troubleshooting) · [FAQ](https://github.com/mohammadreza-zr/figma-tokens/wiki/FAQ) · [Contributing](https://github.com/mohammadreza-zr/figma-tokens/wiki/Contributing)

## Requirements

Node.js 22 or newer (Style Dictionary 5, which this package uses, requires it). The output targets Tailwind CSS v4; it is tested against 4.3.3.

## License

MIT
