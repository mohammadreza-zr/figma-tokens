# Quick start

This page builds the project in [`examples/basic`](https://github.com/mohammadreza-zr/figma-tokens/tree/main/examples/basic). Its output is committed, and the tests regenerate it and fail if it differs, so everything shown here is what the tool really writes.

---

## 1. Export the tokens

Export your Figma variables as JSON and put the files in one folder, for example `tokens/`. The example has two files: `Theme.tokens.json` (colours, radii, durations) and `Typography.tokens.json` (fonts, sizes, weights). What the files must look like is in [[Input-Format]].

Figma adds `$extensions` entries to its export (`com.figma.variableId`, `com.figma.modeName`, …). They are removed while reading.

## 2. Write the config

`figma-tokens.config.mjs`, next to your `package.json`:

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

`input` and `outDir` are the only required options. Relative paths are relative to the folder that holds the config file. Every option is described in [[Configuration]].

## 3. Run it

```bash
npx @mrzr/figma-tokens
```

```
✔ generated/tokens.css
✔ generated/tailwind.css
```

Add scripts so everyone runs it the same way:

```json
{
  "scripts": {
    "tokens": "figma-tokens",
    "tokens:check": "figma-tokens --check"
  }
}
```

## 4. Read what it wrote

A colour that points at another keeps its reference; a colour with its own value becomes `oklch()`. Numbers under `radius`, `size` and `text` get `px`, durations get `ms`:

<!-- verbatim: examples/basic/generated/tokens.css -->
```css
  --color-primitive-white: oklch(1 0 none);
  --color-primitive-black: oklch(0 0 none);
  --color-primitive-blue-500: oklch(0.5461 0.2152 262.88);
  --color-primitive-blue-600: oklch(0.4882 0.2172 264.38);
  --color-primitive-red-500: oklch(0.5771 0.2152 27.33);
  --color-semantic-light-brand-primary-10: oklch(0.5461 0.2152 262.88 / 0.1);
  --radius-sm: 4px;
  --radius-md: 8px;
  --duration-primary: 200ms;
  --font-fa-primary: "Vazirmatn";
  --size-body: 14px;
  --size-heading-lg: 20px;
  --font-weight-regular: 400;
  --font-weight-bold: 700;
  --color-semantic-light-brand-primary: var(--color-primitive-blue-500);
  --color-semantic-light-brand-on-primary: var(--color-primitive-white);
  --color-semantic-light-neutral-background: var(--color-primitive-white);
  --color-semantic-light-neutral-on-background: var(--color-primitive-black);
  --color-semantic-light-status-error: var(--color-primitive-red-500);
  --color-semantic-dark-brand-primary: var(--color-primitive-blue-600);
  --color-semantic-dark-brand-on-primary: var(--color-primitive-white);
  --color-semantic-dark-neutral-background: var(--color-primitive-black);
  --color-semantic-dark-neutral-on-background: var(--color-primitive-white);
```

The order is Style Dictionary's: a variable is defined before any variable that references it. See [[Conversion-Rules]] for how each name and value is produced.

## 5. Use it

Import both files after Tailwind:

```css
@import "tailwindcss";
@import "./generated/tokens.css";
@import "./generated/tailwind.css";
```

```html
<button class="bg-primary text-primary-foreground rounded-md">Save</button>
```

To switch to dark, put the class `dark` on an ancestor, usually `<html>`:

```html
<html class="dark">
```

Under `.dark`, every semantic colour that has a dark value points at it. What `tailwind.css` contains, and which utilities you get, is in [[Tailwind-Output]].

## 6. Keep it fresh in CI

Commit the generated files and run the check in CI:

```bash
npx @mrzr/figma-tokens --check
```

It prints `✔ tokens are up to date` and exits with 0, or lists the files that differ and exits with 1.
