# Input format

The input is a folder of `*.json` files in the shape Figma writes when you export variables (the DTCG token format: `$type` and `$value`, groups as nested objects).

---

## Which files are read

- Every file in `input` whose name ends in `.json`, **not** in subfolders. Keep the tokens in a folder of their own: a `figma-tokens.config.json` or any other JSON file in the same folder would be read as tokens.
- Sorted by file name. The files are merged deeply: groups with the same name are combined, and when two files define the same token, **the later file wins**.
- At least one `.json` file must exist, and each must be valid JSON. The error names the file ([[Troubleshooting]]).

## Collections

The top-level keys of a file are Figma collections. Each one is renamed to a **namespace**, and the namespace becomes the first part of every variable name (`--radius-md`, `--color-…`).

| Collection | Namespace |
|---|---|
| `Colors` | `color` |
| `Radius` | `radius` |
| `Duration` | `duration` |
| `Font`, `Fonts` | `font` |
| `Size`, `Sizes` | `size` |
| `Weight`, `Weights` | `font-weight` |

Names are matched **exactly, including case**: `colors` is not renamed. A collection that is not in the table keeps its own name, lower-cased and dashed (`Spacing` gives `--spacing-sm`). Add or change entries with the [[Configuration]] option `collections`. Two collections that map to one namespace, even in the same file, are merged.

Names that contain spaces work: `"Brand Blue"` becomes `brand-blue`, and references to a collection with spaces in its name are rewritten too.

## Tokens

A token is an object with `$value` (and usually `$type`):

<!-- verbatim: examples/basic/tokens/Theme.tokens.json -->
```json
  "Radius": {
    "Sm": {
      "$type": "number",
      "$value": 4
    },
    "Md": {
      "$type": "number",
      "$value": 8
    }
  },
```

Supported values:

| Kind | Example `$value` | Notes |
|---|---|---|
| Colour, Figma object | `{ "colorSpace": "srgb", "components": [1, 1, 1], "alpha": 1, "hex": "#FFFFFF" }` | Written as the `hex` (or `rgb()` when there is none); with `alpha` below 1 as `rgba()`. Then converted to `oklch()`. |
| Colour, string | `"#2563EB"`, `"rgb(…)"`, `"hsl(…)"`, `"oklch(…)"` | Converted to `oklch()`. With `"$type": "color"` any CSS colour is converted (`"red"` too); without it a string is converted only if it starts with `#`, `rgb`, `hsl` or `oklch`. |
| Number | `8` | Gets `px` under `radius`, `size`, `sizes`, `text` and your `px` list; stays a plain number elsewhere. |
| String | `"Vazirmatn"` | Under `font` it is put in double quotes unless it already starts with one. |
| Duration | `{ "value": 200, "unit": "ms" }`, `200`, `"150"` | Always ends in a unit; `ms` when none is given. |
| Reference | `"{Colors.Primitive.Blue.500}"` | Kept as `var(--…)`. The first part is the collection, written as in the file. |

Any other object value (a shadow, a gradient, a typography style) stops the build, see [[Troubleshooting]].

## Groups, `$root` and the `root` segment

A Figma group can be a token and also hold children, for example `Primary` with the base colour and a `10` tint. Figma writes the base as `$root`:

<!-- verbatim: examples/basic/tokens/Theme.tokens.json -->
```json
          "Primary": {
            "$root": {
              "$type": "color",
              "$value": "{Colors.Primitive.Blue.500}"
            },
            "10": {
              "$type": "color",
              "$value": {
                "colorSpace": "srgb",
                "components": [
                  0.1450980392156863,
                  0.38823529411764707,
                  0.9215686274509803
                ],
                "alpha": 0.1,
                "hex": "#2563EB"
              }
            }
          },
```

`$root` is renamed `root`, and a `root` segment never appears in a variable name: the base is `--color-brand-primary` and the tint is `--color-brand-primary-10`.

## Light and dark colours

Semantic colours are two groups under the colour collection. The names are the defaults of the `semantic` option:

<!-- verbatim: examples/basic/tokens/Theme.tokens.json -->
```json
    "Semantic": {
      "Light": {
        "Brand": {
          "Primary": {
            "$root": {
…
      "Dark": {
        "Brand": {
          "Primary": {
            "$type": "color",
            "$value": "{Colors.Primitive.Blue.600}"
          },
```

Primitive colours (the raw palette that the semantic ones point at) sit under a `Primitive` group, also configurable. How the two are used is in [[Tailwind-Output]].

Light and dark are paired by variable name, so `Light → Brand → Primary → $root` meets `Dark → Brand → Primary`. A dark group that spells its keys differently (`brand`, `primary`) still pairs.

## Not supported

- Subfolders of `input`.
- Composite tokens: any `$value` that is an object, except a duration.
- Two Figma modes exported as two files with the same paths (the later file overwrites the earlier one).
