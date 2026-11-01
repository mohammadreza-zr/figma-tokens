# @mrzr/figma-tokens

Turn the design tokens you export from Figma into CSS: one variable per token, plus a Tailwind CSS v4 theme with the light and dark colours paired for you.

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

**Use something else if not.** It writes CSS only. For iOS, Android or other platforms use [Style Dictionary](https://styledictionary.com) directly: this package is built on it, but exposes none of its platforms. For Tailwind v3 there is no output.

---

## What it does

| | |
|---|---|
| **One variable per token** | `tokens.css` holds every token on `:root`. Colours are converted to `oklch()`, numbers get `px` or `ms` by namespace, and a token that points at another stays a `var(--…)` reference. |
| **Tailwind v4 theme** | `tailwind.css` registers the tokens with `@theme inline`, so `rounded-md`, `font-bold`, `text-body` and colour utilities exist. |
| **Light and dark, paired** | The semantic colours are written once under `:root` and flipped under `.dark`, matched by name. A colour with no dark value keeps its light value and the file says so in a comment. |
| **Aliases** | `aliases: { primary: "brand-primary" }` adds `--color-primary`, so `bg-primary` works. |
| **A freshness check** | `--check` exits with 1 when the files on disk differ from what would be written. |
| **Loud failures** | A broken reference, an invalid JSON file, or a composite token stops the build with a message that names the file or the token. |

---

## What it does not do

Read these before you adopt it. Each one is tested behaviour, not a guess.

- **It does not talk to Figma.** It reads `*.json` files that you exported. Re-export when the design changes.
- **No Tailwind v3.** The output uses `@theme inline`, which is Tailwind v4 syntax. Set `tailwind: false` to get only `tokens.css`.
- **Composite tokens are rejected.** A token whose value is an object (a shadow, a gradient, a typography style) stops the build with `figma-tokens: {Shadow.Card} has a shadow value, which is not supported`. Only colours, numbers, strings and durations are converted. Durations written as `{ "value": 200, "unit": "ms" }` are supported.
- **Light and dark are two groups, not two Figma modes.** The colours must sit in `Colors → Semantic → Light` and `Colors → Semantic → Dark` (the names are configurable). Two files for two modes that share the same paths are not paired: the later file overwrites the earlier one.
- **Dark-only colours are ignored.** The list of semantic names comes from the light group.
- **Alias targets are not checked.** `aliases: { primary: "no-such-colour" }` writes `--color-primary: var(--color-no-such-colour)`.
- **Units come from the namespace.** A number is `px` only under `radius`, `size`, `sizes` and `text`, plus what you list in `px`. Figma exports every number as `number`, so there is no other way to tell a length from a font weight.
- **No watch mode.** Run it again after you export.

---

## Pages

| Page | What is in it |
|---|---|
| [[Installation]] | Requirements and how to run it |
| [[Quick-Start]] | From an export to a working theme, step by step |
| [[Input-Format]] | What the exported JSON must look like |
| [[Conversion-Rules]] | How names, colours and units are produced |
| [[Tailwind-Output]] | What `tailwind.css` contains and how to use it |
| [[Configuration]] | Every option |
| [[CLI]] | Commands, flags and exit codes |
| [[API-Reference]] | `generate`, `write`, `stale` and the rest |
| [[Troubleshooting]] | Every error message and what to do |
| [[FAQ]] | Short answers |
| [[Contributing]] | Working on the package, releasing |
