# FAQ

---

### Does it call the Figma API?

No. It reads `*.json` files that you exported from Figma. Export again when the design changes, run the command, and commit the result.

### Does it work without Tailwind?

Yes. Set `tailwind: false` and you get only `tokens.css`, plain CSS variables. You can also just not import `tailwind.css`.

### Does it work with Tailwind v3?

No. `tailwind.css` uses `@theme inline`, which is Tailwind v4. With v3 use `tokens.css` alone.

### Why are the colours `oklch()`?

Figma exports sRGB. The tool converts every colour value with [culori](https://culorijs.org) to `oklch(L C H)`, with `/ A` added when the colour is transparent. References to other colours stay as `var(--…)` and are not converted.

### Why does every token appear as `--x: var(--x)` in `tailwind.css`?

That is how a variable is registered with Tailwind v4's `@theme inline`: the theme variable `--radius-md` points at the real variable of the same name in `tokens.css`, so `rounded-md` becomes `border-radius: var(--radius-md)`. The tests compile the output with Tailwind and check this.

### Why is there no `bg-primitive-blue-500`?

Primitive colours get a utility only if you list them in `primitives.keep`. The idea is that code uses semantic colours (`bg-primary`) and not the raw palette. The variable `--color-primitive-blue-500` still exists in `tokens.css`.

### My Figma file calls the palette `Premitive`

Use `primitives: { group: "Premitive" }`. The match ignores case.

### Why must light and dark be groups, not Figma modes?

The tool pairs colours by name, from two different paths. If two modes were exported as two files with the same paths, merging them would let the later file overwrite the earlier one, and there would be nothing to pair. Two groups, `Light` and `Dark`, have different paths.

### Can I add my own CSS?

Yes: `extra` adds lines to the last `@theme inline` block ([[Configuration]]). For anything outside `@theme`, write it in your own CSS file and import it after the generated ones.

### Should I commit the generated files?

Yes, and run `figma-tokens --check` in CI. The bundler then needs no extra step, and the diff of a token change is visible in review.

### Why Node 22?

The tool is built on Style Dictionary 5, which requires Node 22.

### Why is composite token support missing?

A shadow or a gradient has no single CSS value in the shape this tool writes. Writing `[object Object]` into a variable would be wrong without being noticed, so the build stops and names the token. Adding real support is a feature, not a flag: open an issue with an example.
