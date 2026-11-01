# Changelog

## 0.2.0

- The config is data, never a script: YAML (`figma-tokens.config.yaml`, `.yml`), JSON (`figma-tokens.config.json`) or an rc file (`.figma-tokensrc`, and its `.yaml`, `.yml` and `.json` variants, which hold YAML or JSON). YAML allows comments and a block of CSS for `extra`.
- **Removed:** `figma-tokens.config.mjs` and `.js` are no longer read, and `--config` on a script stops with `figma-tokens: <file> is a script; the config must be YAML or JSON`. Move the object to YAML or JSON.
- An option the tool does not know, such as a typo, is now an error that lists the valid options. Before, it was ignored.
- `extra` is written with the same indentation whatever indentation it came with: the common indentation is removed and each line gets two spaces. Before, your indentation was kept.
- A config that is not valid YAML or JSON, or not a mapping, stops with a message that names the file.

## 0.1.0

First release.

- Reads the JSON that Figma exports for variables and writes `tokens.css`: one CSS variable per token, colours as `oklch()`, `px` and `ms` added by namespace, references kept as `var(--…)`.
- Writes `tailwind.css` for Tailwind CSS v4: tokens registered with `@theme inline`, light and dark semantic colours paired by name under `:root` and `.dark`, `aliases`, `text-*` sizes, `duration-*` utilities, `fontSans` and `extra`.
- `figma-tokens` command with `--config`, `--check`, `--version` and `--help`; `generate`, `write` and `stale` for use from a script.
- Options: `input`, `outDir`, `css`, `tailwind`, `collections`, `px`, `selector`, `darkSelector`, `semantic`, `primitives`, `aliases`, `fontSans`, `extra`.
- Errors that name the file or the token for invalid JSON, a missing input, a broken reference and composite tokens (shadows, gradients, typography styles), which are not supported.
- Requires Node.js 22 or newer.
