# CLI

```
figma-tokens [build] [--config <file>] [--check]
```

`build` is the only command and the default, so `figma-tokens` and `figma-tokens build` are the same.

| Option | Meaning |
|---|---|
| `--config <file>` | Use this config file |
| `--check` | Write nothing; exit with 1 when the files on disk are out of date |
| `-v`, `--version` | Print the version |
| `-h`, `--help` | Print the usage |

Any other argument stops with `figma-tokens: unknown argument "--chek" (see --help)` and exit code 1.

---

## Finding the config

Without `--config`, the command looks in the **current directory** (not in parent folders) for, in this order:

1. `figma-tokens.config.yaml`
2. `figma-tokens.config.yml`
3. `figma-tokens.config.json`
4. `.figma-tokensrc`
5. `.figma-tokensrc.yaml`
6. `.figma-tokensrc.yml`
7. `.figma-tokensrc.json`

A file named `.json` is read as JSON. Every other file is read as YAML, which includes the `.figma-tokensrc` file with no extension. Since JSON is valid YAML, that file may hold either. A script (`.js`, `.mjs`, `.cjs`, `.ts`, …) is not a config: it stops with `figma-tokens: <file> is a script; the config must be YAML or JSON`.

With `--config`, that file is used and must exist. Relative `input` and `outDir` are resolved against the folder of the config file, so this works from any directory:

```bash
npx @mrzr/figma-tokens --config design/figma-tokens.config.yaml
```

## Writing

```bash
npx @mrzr/figma-tokens
```

```
✔ generated/tokens.css
✔ generated/tailwind.css
```

The paths are printed relative to where you ran the command. Existing files are overwritten; missing folders are created.

## Checking

```bash
npx @mrzr/figma-tokens --check
```

It builds in memory and compares with the files on disk. Up to date:

```
✔ tokens are up to date
```

Out of date or missing (one line per file, on stderr):

```
✖ out of date: generated/tokens.css
Run `npx @mrzr/figma-tokens` and commit the result.
```

## Exit codes

| Code | When |
|---|---|
| `0` | Written, up to date, `--help` or `--version` |
| `1` | `--check` found differences, or any error: no config, bad option, invalid JSON, broken reference, composite token |

Errors are printed to stderr as a single message that starts with `figma-tokens:`, except a broken reference, which prints Style Dictionary's own message. See [[Troubleshooting]].

## In a project

```json
{
  "scripts": {
    "tokens": "figma-tokens",
    "tokens:check": "figma-tokens --check"
  }
}
```

Run `npm run tokens:check` in CI, next to your tests. Commit the generated files so that the check has something to compare with. Line endings are ignored in the comparison, so a Windows checkout with CRLF still passes.
