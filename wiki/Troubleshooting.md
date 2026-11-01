# Troubleshooting

Every message below is what the tool prints. `<file>` and `<dir>` stand for absolute paths.

---

## Messages

### `figma-tokens: no config found; create figma-tokens.config.yaml (see the README)`

None of the config names listed in [[CLI]] (`figma-tokens.config.yaml`, `.yml`, `.json`, or `.figma-tokensrc` and its variants) is in the folder you ran the command from. Parent folders are not searched. `cd` to the right folder, or pass `--config <file>` ([[CLI]]).

### `figma-tokens: no config at <file>`

The file you gave to `--config` does not exist. The path is resolved against the current directory.

### ``figma-tokens: `input` is required`` / ``figma-tokens: `outDir` is required``

The config has no such option ([[Configuration]]).

### `figma-tokens: <file> is a script; the config must be YAML or JSON`

Configs are data. Write the same options as YAML or JSON ([[Configuration]]).

### `figma-tokens: <file> is not valid YAML (<reason>)` / `… is not valid JSON (<reason>)`

The config cannot be parsed. `<reason>` is the parser's message, with the position.

### `figma-tokens: <file> must hold a mapping of options`

A YAML config must be `key: value` pairs at the top level, not a list and not empty.

### `figma-tokens: unknown option "aliase" (options: input, outDir, css, …)`

The config has an option the tool does not know, usually a typo. The message lists the valid names, and [[Configuration]] explains each one.

### `figma-tokens: input folder not found: <dir>`

`input` points at a folder that does not exist. It is resolved against the folder of the config file, not against where you ran the command.

### `figma-tokens: no .json token files in <dir>`

The folder exists but has no file ending in `.json` directly inside it. Subfolders are not read.

### `figma-tokens: <file> is not valid JSON (<reason>)`

The file cannot be parsed. `<reason>` is the parser's message, with the position. Re-export it, or fix the file.

### `{color.Semantic.Light.A} tries to reference {color.Nope}, which is not defined.`

Printed under `Reference Errors:`. A token's value points at a token that does not exist. Both names are written **after** the collections were renamed, so `Colors` shows as `color`. Check the spelling and the case of the reference, and that the target is in one of the exported files.

### `figma-tokens: {Shadow.C} has a shadow value, which is not supported (supported: colors, numbers, strings, durations)`

A token's `$value` is an object other than a duration. Composite tokens are rejected instead of producing a wrong variable. Remove the token from the export, or split it into numbers and colours.

### `figma-tokens: unknown argument "--chek" (see --help)`

A flag the command does not know. The options are in [[CLI]].

### `figma-tokens: --config needs a file`

`--config` was the last argument.

---

## When there is no message, but the result is wrong

### `tailwind.css` has no colour utilities or no `:root` / `.dark` pairs

The tool did not find the semantic colours. Check, in this order:

1. The colour collection must end up in the namespace `color`. `Colors` does by default; a collection with another name (`Palette`) needs `collections: { Palette: "color" }`. Look at `tokens.css`: if the names start with `--palette-` instead of `--color-`, this is the cause.
2. The group names must match `semantic.group`, `semantic.light` and `semantic.dark` (any case).
3. The colours must be under that group, below the colour collection.

Without semantic colours, `tailwind.css` has only section 1 ([[Tailwind-Output]]).

### A length has no unit: `--spacing-sm: 4`

Only `radius`, `size`, `sizes` and `text` get `px`. Add the namespace: `px: ["spacing"]`.

### `duration-primary` does nothing

Check that `tailwind.css` has `--transition-duration-primary`. It is generated for every duration token, so if it is missing, the token is not in a collection that maps to `duration`.

### `bg-primary` does nothing

The alias is not in `aliases`, or its target does not exist. The target is not checked: look for `--color-primary: var(--color-…)` in the last block of `tailwind.css` and make sure the target name appears above it.

### The colours do not change in dark mode

- The class (or attribute) must be on an ancestor, and must match `darkSelector` (default: class `dark`).
- A colour with no dark value is left as it is, with a comment in the `.dark` block: search the file for `no dark token`.
- `dark:` prefixes follow `prefers-color-scheme` unless you add the `@custom-variant` from [[Tailwind-Output]].

### `--check` fails in CI but passes on your machine

`--check` compares the text exactly. Commit the generated files after running the command, and commit your lockfile so that CI installs the same `style-dictionary` and `culori` as you do.

### A variable is written twice

Two tokens produced the same name (`MdLarge` and `Md Large` are both `md-large`). Rename one in Figma. In CSS, the last one wins.
