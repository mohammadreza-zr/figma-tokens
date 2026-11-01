# Configuration

The config is data, not code: YAML or JSON. It is a file named `figma-tokens.config.yaml`, `.yml` or `.json`, or an rc file (`.figma-tokensrc` and its `.yaml`, `.yml` and `.json` variants), searched in the folder you run the command from in the order listed in [[CLI]], or any file you pass with `--config`. YAML is the one the examples use. It allows comments and a block of CSS for `extra`:

<!-- verbatim: examples/basic/figma-tokens.config.yaml -->
```yaml
input: tokens
outDir: generated

primitives:
  keep: [white, black]

fontSans: font-fa-primary

aliases:
  primary: brand-primary
  primary-foreground: brand-on-primary
  background: neutral-background
  foreground: neutral-on-background
  destructive: status-error

extra: |
  --radius: var(--radius-md);
```

An option the tool does not know, such as a typo, stops the build with a message that lists the valid names.

**Relative paths are relative to the folder that holds the config file**, not to where you run the command.

---

## All options

| Option | Type | Default | Meaning |
|---|---|---|---|
| `input` | `string` | required | Folder with the exported `*.json` files |
| `outDir` | `string` | required | Folder the CSS is written to; created when missing |
| `css` | `string` | `"tokens.css"` | File name of the variables file |
| `tailwind` | `string \| false` | `"tailwind.css"` | File name of the Tailwind file, or `false` to not write it |
| `collections` | `Record<string, string>` | see below | Collection name → namespace; merged over the defaults |
| `px` | `string[]` | `[]` | More namespaces whose plain numbers get `px` |
| `selector` | `string` | `":root"` | Selector that carries the variables |
| `darkSelector` | `string` | `".dark"` | Selector that flips the semantic colours |
| `semantic` | `{ group?, light?, dark? }` | `"semantic"`, `"light"`, `"dark"` | Names of the groups under the colour collection |
| `primitives` | `{ group?, keep? }` | `"primitive"`, `[]` | The primitive group, and which primitives get a utility |
| `aliases` | `Record<string, string>` | `{}` | Short colour names |
| `fontSans` | `string` | none | Variable (without `--`) that `--font-sans` points at |
| `extra` | `string` | `""` | Raw CSS added to the last `@theme inline` block |

---

## `collections`

Maps a Figma collection to the namespace used in variable names. Your entries are merged over these defaults, so you only write the differences:

| Collection | Namespace |
|---|---|
| `Colors` | `color` |
| `Radius` | `radius` |
| `Duration` | `duration` |
| `Font`, `Fonts` | `font` |
| `Size`, `Sizes` | `size` |
| `Weight`, `Weights` | `font-weight` |

Names match exactly, including case. A collection called `Palette` is not renamed, so its variables are named `--palette-…` and `tailwind.css` finds no colours. Map it:

```yaml
collections:
  Palette: color
```

The semantic and primitive colours must end up under the namespace **`color`**: that name is fixed.

## `px`

A plain number gets `px` under `radius`, `size`, `sizes` and `text`. Add other namespaces here. The names are compared in lower case:

```yaml
px: [spacing]   # --spacing-sm: 4  becomes  --spacing-sm: 4px
```

## `selector` and `darkSelector`

`selector` carries the variables in `tokens.css` and the light layer in `tailwind.css`. `darkSelector` carries the dark layer. For dark mode through an attribute:

```yaml
darkSelector: '[data-theme="dark"]'
```

If you change it, change the Tailwind `@custom-variant` as well ([[Tailwind-Output]]).

## `semantic`

The group that holds the semantic colours, and the names of its light and dark children, **below the colour collection**. They are matched without regard to case; write them as they are spelled in the file. The defaults fit `Colors → Semantic → Light` and `Colors → Semantic → Dark`:

```yaml
semantic:
  group: Theme
  light: Day
  dark: Night
```

## `primitives`

`group` is the name of the raw palette group, default `primitive` (some Figma files spell it `Premitive`; write what your file has). `keep` lists the primitives that get a Tailwind utility. A name in `keep` is compared, in lower case, with the **first segment after the group**, so `keep: ["blue"]` keeps every shade under `Primitive → Blue`:

```yaml
primitives:
  group: Premitive
  keep: [white, black]
```

Primitives not in `keep` stay in `tokens.css` and keep working as the target of references. They only get no utility.

## `aliases`

`{ alias: target }` writes `--color-alias: var(--color-target)` in the last `@theme inline` block, so `bg-alias` works. The target is a semantic colour name, like `brand-primary`. It is **not checked**:

```yaml
aliases:
  primary: brand-primary
  background: neutral-background
```

## `fontSans`

The name of the font variable, without the dashes. `fontSans: font-fa-primary` writes `--font-sans: var(--font-fa-primary);` in `:root` and `--font-sans: var(--font-sans);` in the theme block, so Tailwind's `font-sans` uses your font.

## `extra`

Raw CSS appended to the last `@theme inline` block, after the generated lines. The common indentation of your lines is removed and every line is then indented by two spaces, so the result is the same whatever indentation you wrote. Blank lines inside are kept; blank lines at the start and the end are not. In YAML, a block scalar (`|`) is the natural way to write it:

```yaml
extra: |
  --radius: var(--radius-md);
  --shadow-soft: 0 2px 7px -4px var(--color-neutral-shadow);
```

---

## Other formats

The same options as JSON, in `figma-tokens.config.json` (no comments, and `extra` is one string with `\n`):

```json
{
  "input": "tokens",
  "outDir": "generated",
  "primitives": { "keep": ["white", "black"] },
  "aliases": { "primary": "brand-primary" }
}
```

Or in an rc file, `.figma-tokensrc`, which holds YAML or JSON. It keeps the project root free of one more visible file:

```yaml
input: tokens
outDir: generated
```

## Errors

A missing `input` or `outDir` stops with ``figma-tokens: `input` is required`` (or `outDir`). An unknown option stops with `figma-tokens: unknown option "<name>" (options: …)`. A config that is not valid YAML or JSON stops with `figma-tokens: <file> is not valid YAML (…)` (or `JSON`), one that is not a mapping with `figma-tokens: <file> must hold a mapping of options`, and a script with `figma-tokens: <file> is a script; the config must be YAML or JSON`. See [[Troubleshooting]].
