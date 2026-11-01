# Contributing

```bash
git clone https://github.com/mohammadreza-zr/figma-tokens.git
cd figma-tokens
npm install
npm test     # builds, then runs every test
```

---

## Layout

```
src/
  index.ts      public exports: generate, write, stale and the config helpers
  cli.ts        the figma-tokens command: argument parsing, --check, exit codes
  config.ts     the config type, defaults, resolveConfig, findConfig, loadConfig
  build.ts      reads the input, runs the steps, rejects composite tokens, returns
                the files; write and stale
  clean.ts      renames collections and $root, rewrites references, flattens
                Figma colour objects, strips $extensions, merges files deeply
  css.ts        Style Dictionary: names, oklch, units; also kebab()
  tailwind.ts   the Tailwind v4 file: theme registration, light/dark pairing
examples/
  basic/        a real input, its config and its committed output
test/
  build.test.mjs   the behaviour, with real files and the real Tailwind compiler
  docs.test.mjs    checks the docs against the real files
scripts/test.mjs   runs every test/*.test.mjs
wiki/              these pages
```

## Rules

- **No project names in `src/`.** A colour alias, a font variable, a collection spelling belongs in the user's config.
- **The output must not change by accident.** The committed files in `examples/basic/generated` must equal what the tool writes. After a deliberate change, regenerate them:

  ```bash
  npm run build
  cd examples/basic && node ../../dist/cli.js
  ```

- **Tests use real files.** No mocks, stubs or fake timers. Each behaviour has a test with a small input written to a temporary folder, or the example project.
- **Docs are checked.** A code block directly under `<!-- verbatim: path -->` must consist of lines of that file, in order, and every wiki link written in double square brackets must point at a page. `npm test` fails when they do not.
- **A change to behaviour needs the wiki and `CHANGELOG.md` updated.**

## Releasing

1. Update `CHANGELOG.md`.
2. `npm version patch` (or `minor`, `major`) and `git push --follow-tags`.
3. The `release` workflow checks that the tag equals the version in `package.json`, runs the typecheck and the tests on Node 22 and 24, checks the type resolution, publishes to npm with provenance (trusted publishing, no token) and creates the GitHub release.

Trusted publishing is set up once on npmjs.com for the package: Settings → Trusted Publisher → GitHub Actions, user `mohammadreza-zr`, repository `figma-tokens`, workflow `release.yml`.

## The wiki

`wiki/` is the source. Publish it to the GitHub Wiki with:

```bash
npm run docs:sync
```

GitHub creates the wiki repository only once a first page exists. Enable it in the repository settings (Features → Wikis) and create any page in the browser, then run the command; it replaces the pages.
