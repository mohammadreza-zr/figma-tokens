# Conversion rules

How a token in the JSON becomes a line in `tokens.css`. The same names are used in `tailwind.css`.

---

## Variable names

The name is the token's path, after the collection has been renamed to its namespace ([[Input-Format]]):

1. Every path segment named `root` (any case) is dropped.
2. A lower-case letter or digit followed by an upper-case letter gets a hyphen between them: `OnPrimary` → `on-primary`, `MdLarge` → `md-large`.
3. Whitespace becomes a hyphen: `Brand Blue` → `brand-blue`.
4. Everything is lower-cased and the segments are joined with `-`, prefixed with `--`.

| Path in the JSON | Variable |
|---|---|
| `Radius.Md` | `--radius-md` |
| `Font.Fa.Primary` | `--font-fa-primary` |
| `Size.Heading.Lg` | `--size-heading-lg` |
| `Colors.Semantic.Light.Brand.Primary.$root` | `--color-semantic-light-brand-primary` |
| `Colors.Semantic.Light.Brand.Primary.10` | `--color-semantic-light-brand-primary-10` |
| `Colors.Semantic.Light.Brand.OnPrimary` | `--color-semantic-light-brand-on-primary` |

Names are not checked for collisions. Two paths that produce the same name (`MdLarge` and `Md Large`) write the same variable twice, and in CSS the last one wins.

---

## Values

| Token | Becomes | Example |
|---|---|---|
| Colour | `oklch(L C H)`, or `oklch(L C H / A)` when the alpha is below 1 | `oklch(0.5461 0.2152 262.88)` |
| Colour that is a reference | `var(--other)` | `var(--color-primitive-blue-500)` |
| Number under `radius`, `size`, `sizes`, `text` or a namespace in `px` | number + `px` | `8px` |
| Number elsewhere | unchanged | `700` |
| Duration | number + unit, `ms` when there is none | `200ms` |
| String under `font` | double-quoted | `"Vazirmatn"` |

Details that are easy to miss:

- **Rounding.** `L` and `C` have 4 decimals, `H` has 2, alpha has 4. An achromatic colour has no hue and is written `none`: white is `oklch(1 0 none)`.
- **Alpha.** An alpha of 0.9999 or more is dropped.
- **Namespaces are compared in lower case** against the first part of the name.
- **`font-weight` is not `font`.** Weights are plain numbers and are never quoted.
- **Only the first segment decides.** `Size.Heading.Lg` gets `px` because `Size` is the namespace.

Anything else passes through Style Dictionary's `css/variables` format as it is. A number under a namespace that is not in the list stays a bare number, which is not a valid CSS length: add the namespace to `px` ([[Configuration]]).

---

## References

A value written `"{Colors.Primitive.Blue.500}"` becomes `var(--color-primitive-blue-500)`. Before that the first part is rewritten with the namespace table, so references keep working after the rename. Two things follow:

- A reference to a token that does not exist stops the build and names both ends: `{color.Semantic.Light.A} tries to reference {color.Nope}, which is not defined.` ([[Troubleshooting]]).
- `$root` inside a reference is read as `root`.

---

## Order in the file

Style Dictionary writes a variable before any variable that references it. So the primitive colours come first, and the semantic colours that point at them after. The tests check that no `var(--x)` appears before `--x` is defined.

---

## Pairing light and dark

Pairing happens in `tailwind.css`, not here: `tokens.css` keeps `--color-semantic-light-…` and `--color-semantic-dark-…` as two independent sets. See [[Tailwind-Output]].
