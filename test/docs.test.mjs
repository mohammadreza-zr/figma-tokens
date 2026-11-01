import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const wiki = path.join(root, "wiki");
const pages = [
  path.join(root, "README.md"),
  ...readdirSync(wiki)
    .filter((n) => n.endsWith(".md"))
    .map((n) => path.join(wiki, n)),
];

const MARKER = /<!-- verbatim: (\S+) -->\n```[^\n]*\n([\s\S]*?)```/g;

// Every non-empty line of a marked block must be a line of the named file, in order.
// A line that is only "…" stands for lines left out.
test("marked code blocks in the docs are lines of the real files", () => {
  let checked = 0;
  for (const page of pages) {
    const text = readFileSync(page, "utf8");
    for (const [, file, block] of text.matchAll(MARKER)) {
      const real = readFileSync(path.join(root, file), "utf8").split("\n").map((l) => l.trimEnd());
      let at = 0;
      for (const line of block.split("\n").map((l) => l.trimEnd())) {
        if (line.trim() === "" || line.trim() === "…") continue;
        const found = real.indexOf(line, at);
        assert.ok(found >= 0, `${path.basename(page)}: line not found in ${file} (in order): ${line}`);
        at = found + 1;
        checked++;
      }
    }
  }
  assert.ok(checked > 0, "no marked blocks found");
});

test("every [[Page]] link in the wiki points at a page", () => {
  const names = new Set(readdirSync(wiki).map((n) => n.replace(/\.md$/, "")));
  for (const page of pages.filter((p) => p.startsWith(wiki))) {
    for (const [, target] of readFileSync(page, "utf8").matchAll(/\[\[([^\]|#]+)/g)) {
      assert.ok(names.has(target.trim()), `${path.basename(page)} links to a missing page: ${target}`);
    }
  }
});
