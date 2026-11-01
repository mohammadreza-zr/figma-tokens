# API reference

```js
import {
  generate, write, stale,
  defineConfig, resolveConfig, findConfig, loadConfig,
  DEFAULT_COLLECTIONS,
} from "@mrzr/figma-tokens";
```

The package is ESM. The command line is built on these functions: it is `findConfig` → `loadConfig` → `generate` → `write` (or `stale` for `--check`).

---

## `generate(config, cwd?)`

```ts
generate(config: FigmaTokensConfig, cwd?: string): Promise<OutputFile[]>
```

Reads the input, builds the CSS and returns it. **Writes nothing.** `cwd` is the folder that relative `input` and `outDir` are resolved against; it defaults to `process.cwd()`. The result has one entry for `css`, and one for `tailwind` unless it is `false`.

```ts
interface OutputFile {
  path: string;    // absolute
  content: string;
}
```

It rejects with the errors in [[Troubleshooting]].

## `write(files)`

```ts
write(files: OutputFile[]): void
```

Creates the folders and writes each file, overwriting it.

## `stale(files)`

```ts
stale(files: OutputFile[]): string[]
```

Returns the paths whose file is missing or whose content differs from what `generate` returned. An empty array means up to date. This is what `--check` uses.

```js
import { generate, loadConfig, stale, write } from "@mrzr/figma-tokens";

const config = await loadConfig("figma-tokens.config.mjs");
const files = await generate(config, process.cwd());
if (stale(files).length > 0) write(files);
```

## `defineConfig(config)`

Returns the object you pass. It only gives your editor the types.

## `resolveConfig(config)`

```ts
resolveConfig(config: FigmaTokensConfig): ResolvedConfig
```

Applies every default ([[Configuration]]), merges `collections` over `DEFAULT_COLLECTIONS` and lower-cases `px` and `primitives.keep`. Throws when `input` or `outDir` is missing. `generate` calls it for you.

## `findConfig(cwd, explicit?)`

```ts
findConfig(cwd: string, explicit?: string): string
```

Returns the absolute path of the config: `explicit` resolved against `cwd`, or the first of the three default names found in `cwd`. Throws `figma-tokens: no config at <file>` or `figma-tokens: no config found; create figma-tokens.config.mjs (see the README)`.

## `loadConfig(file)`

```ts
loadConfig(file: string): Promise<FigmaTokensConfig>
```

Parses a `.json` file, or imports any other file and returns its default export. Throws `figma-tokens: <file> has no default export` when there is none. The paths in the result are **not** resolved: pass the folder of the config file as `cwd` to `generate`, as the CLI does.

## `DEFAULT_COLLECTIONS`

The collection table from [[Input-Format]], as `Record<string, string>`.

## Types

`FigmaTokensConfig`, `ResolvedConfig` and `OutputFile` are exported as types. The fields of `FigmaTokensConfig` are the options in [[Configuration]].
