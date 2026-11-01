import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { generate, loadConfig, stale } from "../dist/index.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const example = path.join(root, "examples/basic");
const fixtures = path.join(example, "tokens");
const cli = path.join(root, "dist/cli.js");

const config = await loadConfig(path.join(example, "figma-tokens.config.yaml"));

const byName = (files, name) =>
  files.find((f) => f.path.endsWith(name)).content;

test("the committed example output is what the tool generates", async () => {
  assert.deepEqual(stale(await generate(config, example)), []);
});

test("tokens.css: references stay, colours become oklch, units are added", async () => {
  const css = byName(await generate(config, example), "tokens.css");
  assert.match(css, /--color-primitive-blue-500: oklch\(0\.5461 0\.2152 262\.88\);/);
  assert.match(css, /--color-semantic-light-brand-primary: var\(--color-primitive-blue-500\);/);
  assert.match(css, /--color-semantic-light-brand-primary-10: oklch\([^)]*\/ 0\.1\);/);
  assert.match(css, /--radius-md: 8px;/);
  assert.match(css, /--duration-primary: 200ms;/);
  assert.match(css, /--font-fa-primary: "Vazirmatn";/);
  assert.match(css, /--font-weight-bold: 700;/);
});

test("tokens.css: a variable is defined before any variable that references it", async () => {
  const css = byName(await generate(config, example), "tokens.css");
  const lines = css.split("\n");
  lines.forEach((line, i) => {
    const ref = line.match(/var\((--[\w-]+)\)/);
    if (!ref) return;
    const defined = lines.findIndex((l) => l.trimStart().startsWith(`${ref[1]}:`));
    assert.ok(defined >= 0 && defined < i, `${ref[1]} is used on line ${i + 1} before it is defined`);
  });
});

test("tailwind.css: light and dark are paired, a missing dark keeps light", async () => {
  const tw = byName(await generate(config, example), "tailwind.css");
  assert.match(tw, /--color-brand-primary: var\(--color-semantic-light-brand-primary\);/);
  assert.match(
    tw,
    /\.dark \{[^}]*--color-brand-primary: var\(--color-semantic-dark-brand-primary\);/s,
  );
  assert.match(tw, /\/\* --color-status-error: no dark token in Figma/);
  assert.match(tw, /--color-primary: var\(--color-brand-primary\);/);
  assert.match(tw, /--text-body: var\(--size-body\);/);
  assert.match(tw, /--text-heading-lg: var\(--size-heading-lg\);/);
  assert.match(tw, /--font-sans: var\(--font-fa-primary\);/);
  assert.match(tw, /^ {2}--radius: var\(--radius-md\);$/m);
});

test("primitives: only the kept ones get a utility", async () => {
  const tw = byName(await generate(config, example), "tailwind.css");
  const theme = tw.split("@theme inline")[1];
  assert.match(theme, /--color-primitive-white: var\(--color-primitive-white\);/);
  assert.match(theme, /--color-primitive-black: var\(--color-primitive-black\);/);
  assert.doesNotMatch(theme, /--color-primitive-blue/);
});

test("tailwind: false skips the Tailwind file", async () => {
  const files = await generate({ ...config, tailwind: false }, example);
  assert.deepEqual(files.map((f) => path.basename(f.path)), ["tokens.css"]);
});

test("two input files with the same top-level key are merged deeply", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "figma-tokens-"));
  writeFileSync(path.join(dir, "a.json"), JSON.stringify({ Size: { A: { $type: "dimension", $value: 1 } } }));
  writeFileSync(path.join(dir, "b.json"), JSON.stringify({ Size: { B: { $type: "dimension", $value: 2 } } }));
  const css = byName(await generate({ input: dir, outDir: "out", tailwind: false }, dir), "tokens.css");
  assert.match(css, /--size-a: 1px;/);
  assert.match(css, /--size-b: 2px;/);
});

test("CLI: build writes, --check passes, then fails once a token changes", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "figma-tokens-"));
  cpSync(fixtures, path.join(dir, "tokens"), { recursive: true });
  writeFileSync(
    path.join(dir, "figma-tokens.config.json"),
    JSON.stringify({ input: "tokens", outDir: "out", primitives: { keep: ["white"] } }),
  );
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], { cwd: dir, encoding: "utf8" });

  assert.equal(run("--check").status, 1);
  assert.equal(run().status, 0);
  assert.match(readFileSync(path.join(dir, "out/tokens.css"), "utf8"), /--radius-md: 8px;/);
  assert.equal(run("--check").status, 0);

  const theme = path.join(dir, "tokens/Theme.tokens.json");
  writeFileSync(theme, readFileSync(theme, "utf8").replace('"$value": 8', '"$value": 12'));
  const stale = run("--check");
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /out of date: out\/tokens\.css/);
});

test("CLI: no config is a clear error", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "figma-tokens-"));
  const r = spawnSync(process.execPath, [cli], { cwd: dir, encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /no config found/);
});

const fromJson = (files) => {
  const dir = mkdtempSync(path.join(tmpdir(), "figma-tokens-"));
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(path.join(dir, name), content);
  }
  return dir;
};

test("an invalid JSON file is named in the error", async () => {
  const dir = fromJson({ "broken.json": "{ bad" });
  await assert.rejects(
    generate({ input: dir, outDir: "out" }, dir),
    /broken\.json is not valid JSON/,
  );
});

test("a broken reference names the token and the missing target", async () => {
  const dir = fromJson({
    "a.json": JSON.stringify({
      Colors: { Semantic: { Light: { A: { $type: "color", $value: "{Colors.Nope}" } } } },
    }),
  });
  await assert.rejects(
    generate({ input: dir, outDir: "out" }, dir),
    /tries to reference \{color\.Nope\}, which is not defined/,
  );
});

test("without a semantic group the empty light and dark blocks are left out", async () => {
  const dir = fromJson({
    "a.json": JSON.stringify({ Radius: { Md: { $type: "dimension", $value: 8 } } }),
  });
  const tw = byName(await generate({ input: dir, outDir: "out" }, dir), "tailwind.css");
  assert.doesNotMatch(tw, /:root/);
  assert.doesNotMatch(tw, /\.dark/);
  assert.match(tw, /--radius-md: var\(--radius-md\);/);
});

test("nested size tokens each get their own text-* name", async () => {
  const dir = fromJson({
    "a.json": JSON.stringify({
      Size: {
        Text: { Sm: { $type: "number", $value: 12 } },
        Body: { $type: "number", $value: 14 },
      },
    }),
  });
  const tw = byName(await generate({ input: dir, outDir: "out" }, dir), "tailwind.css");
  assert.match(tw, /--text-text-sm: var\(--size-text-sm\);/);
  assert.match(tw, /--text-body: var\(--size-body\);/);
  assert.doesNotMatch(tw, /--text-text:/);
});

test("CLI: an unknown argument fails, --version prints the package version", () => {
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
  const bad = run("--chek");
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /unknown argument "--chek"/);
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(run("--version").stdout.trim(), pkg.version);
});

test("CLI: relative paths in the config are relative to the config file", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "figma-tokens-"));
  const sub = path.join(dir, "design");
  cpSync(fixtures, path.join(sub, "tokens"), { recursive: true });
  writeFileSync(
    path.join(sub, "figma-tokens.config.json"),
    JSON.stringify({ input: "tokens", outDir: "out" }),
  );
  const r = spawnSync(process.execPath, [cli, "--config", "design/figma-tokens.config.json"], {
    cwd: dir,
    encoding: "utf8",
  });
  assert.equal(r.status, 0);
  assert.match(readFileSync(path.join(sub, "out/tokens.css"), "utf8"), /--radius-md: 8px;/);
});

test("light and dark are paired by variable name, whatever the key spelling", async () => {
  const color = { $type: "color", $value: "#ff0000" };
  const dir = fromJson({
    "a.json": JSON.stringify({
      Colors: {
        Semantic: {
          Light: { Brand: { Primary: { $root: color, 10: color } }, OnlyLight: color },
          Dark: { brand: { primary: color }, OnlyDark: color },
        },
      },
    }),
  });
  const tw = byName(await generate({ input: dir, outDir: "out" }, dir), "tailwind.css");
  const dark = tw.match(/\.dark \{([^}]*)\}/)[1];
  assert.match(dark, /^ {2}--color-brand-primary: var\(--color-semantic-dark-brand-primary\);$/m);
  assert.match(dark, /\/\* --color-brand-primary-10: no dark token/);
  assert.match(dark, /\/\* --color-only-light: no dark token/);
  assert.doesNotMatch(dark, /only-dark/);
});

test("the generated Tailwind file compiles to the utilities the docs promise", async () => {
  const { compile } = await import("@tailwindcss/node");
  const gen = path.join(example, "generated");
  const source = [
    '@import "tailwindcss/theme.css" theme(static);',
    '@import "tailwindcss/utilities.css";',
    readFileSync(path.join(gen, "tokens.css"), "utf8"),
    readFileSync(path.join(gen, "tailwind.css"), "utf8"),
  ].join("\n");
  const compiler = await compile(source, { base: root, onDependency() {} });
  const css = compiler.build([
    "bg-primary",
    "text-primary-foreground",
    "bg-background",
    "bg-brand-primary-10",
    "bg-primitive-white",
    "bg-primitive-blue-500",
    "rounded-md",
    "duration-primary",
    "text-body",
    "text-heading-lg",
    "font-bold",
    "font-sans",
    "font-fa-primary",
    "font-regular",
  ]);
  const rule = (name) => css.match(new RegExp(`\\.${name} \\{([^}]*)\\}`))?.[1].trim();
  assert.equal(rule("bg-primary"), "background-color: var(--color-brand-primary);");
  assert.equal(rule("text-primary-foreground"), "color: var(--color-brand-on-primary);");
  assert.equal(rule("bg-background"), "background-color: var(--color-neutral-background);");
  assert.equal(rule("bg-brand-primary-10"), "background-color: var(--color-brand-primary-10);");
  assert.equal(rule("bg-primitive-white"), "background-color: var(--color-primitive-white);");
  assert.equal(rule("bg-primitive-blue-500"), undefined);
  assert.equal(rule("rounded-md"), "border-radius: var(--radius-md);");
  assert.match(rule("duration-primary"), /transition-duration: var\(--duration-primary\);/);
  assert.equal(rule("text-body"), "font-size: var(--size-body);");
  assert.equal(rule("text-heading-lg"), "font-size: var(--size-heading-lg);");
  assert.match(rule("font-bold"), /font-weight: var\(--font-weight-bold\);/);
  assert.equal(rule("font-sans"), "font-family: var(--font-sans);");
  assert.equal(rule("font-fa-primary"), "font-family: var(--font-fa-primary);");
  assert.match(rule("font-regular"), /font-weight: var\(--font-weight-regular\);/);
});

test("a composite token such as a shadow is rejected, naming the token", async () => {
  const dir = fromJson({
    "a.json": JSON.stringify({
      Shadow: { Card: { $type: "shadow", $value: { offsetX: "0px", blur: "4px" } } },
    }),
  });
  await assert.rejects(
    generate({ input: dir, outDir: "out" }, dir),
    /\{Shadow\.Card\} has a shadow value, which is not supported/,
  );
});

test("px adds the unit to the extra namespaces it names", async () => {
  const dir = fromJson({
    "a.json": JSON.stringify({ Spacing: { Sm: { $type: "number", $value: 4 } } }),
  });
  const plain = byName(await generate({ input: dir, outDir: "out" }, dir), "tokens.css");
  assert.match(plain, /--spacing-sm: 4;/);
  const withPx = byName(await generate({ input: dir, outDir: "out", px: ["Spacing"] }, dir), "tokens.css");
  assert.match(withPx, /--spacing-sm: 4px;/);
});

test("collection and group names with spaces work, in names and in references", async () => {
  const dir = fromJson({
    "a.json": JSON.stringify({
      "Color Primitives": { "Brand Blue": { $type: "color", $value: "#2563EB" } },
      "Color Semantic": {
        Light: { "Brand Primary": { $type: "color", $value: "{Color Primitives.Brand Blue}" } },
      },
    }),
  });
  const css = byName(
    await generate(
      { input: dir, outDir: "out", tailwind: false, collections: { "Color Primitives": "color", "Color Semantic": "color" } },
      dir,
    ),
    "tokens.css",
  );
  assert.match(css, /--color-brand-blue: oklch\(/);
  assert.match(css, /--color-light-brand-primary: var\(--color-brand-blue\);/);
});

test("two collections that map to one namespace in the same file are merged", async () => {
  const dir = fromJson({
    "a.json": JSON.stringify({
      Font: { A: { $type: "string", $value: "x" } },
      Fonts: { B: { $type: "string", $value: "y" } },
    }),
  });
  const css = byName(await generate({ input: dir, outDir: "out", tailwind: false }, dir), "tokens.css");
  assert.match(css, /--font-a: "x";/);
  assert.match(css, /--font-b: "y";/);
});

test("with the documented @custom-variant, dark: follows the .dark class", async () => {
  const { compile } = await import("@tailwindcss/node");
  const gen = path.join(example, "generated");
  const source = [
    '@import "tailwindcss/theme.css" theme(static);',
    '@import "tailwindcss/utilities.css";',
    "@custom-variant dark (&:where(.dark, .dark *));",
    readFileSync(path.join(gen, "tokens.css"), "utf8"),
    readFileSync(path.join(gen, "tailwind.css"), "utf8"),
  ].join("\n");
  const compiler = await compile(source, { base: root, onDependency() {} });
  const css = compiler.build(["dark:bg-background"]);
  assert.match(css, /\.dark\\:bg-background:where\(\.dark, \.dark \*\) \{/);
});

test("a UTF-8 BOM at the start of a token file is ignored", async () => {
  const dir = fromJson({
    "a.json": `﻿${JSON.stringify({ Radius: { Md: { $type: "number", $value: 8 } } })}`,
  });
  const css = byName(await generate({ input: dir, outDir: "out", tailwind: false }, dir), "tokens.css");
  assert.match(css, /--radius-md: 8px;/);
});

test("stale ignores line-ending differences, so a CRLF checkout still passes --check", async () => {
  const files = await generate(config, example);
  const dir = mkdtempSync(path.join(tmpdir(), "figma-tokens-"));
  const crlf = files.map((f) => ({ ...f, path: path.join(dir, path.basename(f.path)) }));
  for (const f of crlf) writeFileSync(f.path, f.content.replace(/\n/g, "\r\n"));
  assert.deepEqual(stale(crlf), []);
  writeFileSync(crlf[0].path, crlf[0].content.replace("8px", "9px"));
  assert.deepEqual(stale(crlf), [crlf[0].path]);
});

const inTempProject = (files) => {
  const dir = mkdtempSync(path.join(tmpdir(), "figma-tokens-"));
  cpSync(fixtures, path.join(dir, "tokens"), { recursive: true });
  for (const [name, content] of Object.entries(files)) writeFileSync(path.join(dir, name), content);
  return dir;
};
const runIn = (dir, ...args) => spawnSync(process.execPath, [cli, ...args], { cwd: dir, encoding: "utf8" });

test("CLI: a YAML config is found and its comments and block text work", () => {
  const dir = inTempProject({
    "figma-tokens.config.yaml": "# where the exports are\ninput: tokens\noutDir: out\naliases:\n  primary: brand-primary\nextra: |\n  --radius: var(--radius-md);\n",
  });
  assert.equal(runIn(dir).status, 0);
  const tw = readFileSync(path.join(dir, "out/tailwind.css"), "utf8");
  assert.match(tw, /^ {2}--color-primary: var\(--color-brand-primary\);$/m);
  assert.match(tw, /^ {2}--radius: var\(--radius-md\);$/m);
});

test("CLI: .yml, .mjs and .js configs are found too", () => {
  const yml = inTempProject({ "figma-tokens.config.yml": "input: tokens\noutDir: out\n" });
  assert.equal(runIn(yml).status, 0);
  for (const name of ["figma-tokens.config.mjs", "figma-tokens.config.js"]) {
    const dir = inTempProject({ [name]: 'export default { input: "tokens", outDir: "out" };\n', "package.json": '{"type":"module"}' });
    assert.equal(runIn(dir).status, 0, name);
    assert.ok(readFileSync(path.join(dir, "out/tokens.css"), "utf8").includes("--radius-md"));
  }
});

test("a YAML file that is not a mapping is rejected", () => {
  const dir = inTempProject({ "figma-tokens.config.yaml": "- input\n- outDir\n" });
  const r = runIn(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /figma-tokens\.config\.yaml must hold a mapping of options/);
});

test("an unknown option is an error that lists the valid ones", async () => {
  await assert.rejects(
    generate({ input: fixtures, outDir: "out", aliase: {} }, example),
    /unknown option "aliase" \(options: input, outDir, css, tailwind, collections, px, selector, darkSelector, semantic, primitives, aliases, fontSans, extra\)/,
  );
});

test("extra is written with the same indentation whatever indentation it came with", async () => {
  const lines = ["--a: 1;", "", "/* note */", "--b: 2;"];
  const variants = [lines.join("\n"), lines.map((l) => (l ? `    ${l}` : l)).join("\n"), `\n\n${lines.map((l) => (l ? `  ${l}` : l)).join("\n")}\n\n`];
  const outputs = [];
  for (const extra of variants) {
    const tw = byName(await generate({ ...config, extra }, example), "tailwind.css");
    outputs.push(tw.slice(tw.indexOf("--a: 1;") - 2, tw.indexOf("--b: 2;") + 7));
  }
  assert.equal(outputs[0], "  --a: 1;\n\n  /* note */\n  --b: 2;");
  assert.deepEqual(outputs, [outputs[0], outputs[0], outputs[0]]);
});
