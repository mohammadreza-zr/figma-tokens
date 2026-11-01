# Changelog

## 0.1.0

First release.

- Reads the JSON that Figma exports for variables and writes `tokens.css`: one CSS variable per token, colours as `oklch()`, `px` and `ms` added by namespace, references kept as `var(--…)`.
- Writes `tailwind.css` for Tailwind CSS v4: tokens registered with `@theme inline`, light and dark semantic colours paired by name under `:root` and `.dark`, `aliases`, `text-*` sizes, `duration-*` utilities, `fontSans` and `extra`.
- `figma-tokens` command with `--config`, `--check`, `--version` and `--help`; `generate`, `write` and `stale` for use from a script.
- Options: `input`, `outDir`, `css`, `tailwind`, `collections`, `px`, `selector`, `darkSelector`, `semantic`, `primitives`, `aliases`, `fontSans`, `extra`.
- Errors that name the file or the token for invalid JSON, a missing input, a broken reference and composite tokens (shadows, gradients, typography styles), which are not supported.
- Requires Node.js 22 or newer.
