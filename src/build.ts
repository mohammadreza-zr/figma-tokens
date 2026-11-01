import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { cleanTokens, type Tree } from "./clean.js";
import {
  resolveConfig,
  type FigmaTokensConfig,
} from "./config.js";
import { buildCss } from "./css.js";
import { buildTailwind } from "./tailwind.js";

export interface OutputFile {
  path: string;
  content: string;
}

function readTokenFiles(dir: string): Tree[] {
  if (!existsSync(dir)) {
    throw new Error(`figma-tokens: input folder not found: ${dir}`);
  }
  const names = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  if (names.length === 0) {
    throw new Error(`figma-tokens: no .json token files in ${dir}`);
  }
  return names.map((name) => {
    const file = path.join(dir, name);
    try {
      return JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, "")) as Tree;
    } catch (error) {
      throw new Error(`figma-tokens: ${file} is not valid JSON (${(error as Error).message})`);
    }
  });
}

function assertSupported(node: Tree, prefix: string[] = []): void {
  for (const [key, value] of Object.entries(node)) {
    if (!value || typeof value !== "object") continue;
    const here = [...prefix, key];
    if (!("$value" in value)) {
      assertSupported(value as Tree, here);
      continue;
    }
    const v = (value as Tree).$value;
    const isDuration = here[0].toLowerCase() === "duration";
    if (v !== null && typeof v === "object" && !isDuration) {
      throw new Error(
        `figma-tokens: {${here.join(".")}} has a ${(value as Tree).$type ?? "composite"} value, which is not supported (supported: colors, numbers, strings, durations)`,
      );
    }
  }
}

export async function generate(
  input: FigmaTokensConfig,
  cwd = process.cwd(),
): Promise<OutputFile[]> {
  const config = resolveConfig(input);
  const files = readTokenFiles(path.resolve(cwd, config.input));
  const merged = cleanTokens(files, config.collections);
  assertSupported(merged);
  const outDir = path.resolve(cwd, config.outDir);

  const out: OutputFile[] = [
    {
      path: path.join(outDir, config.css),
      content: await buildCss(merged, config),
    },
  ];
  if (config.tailwind) {
    out.push({
      path: path.join(outDir, config.tailwind),
      content: buildTailwind(merged, config),
    });
  }
  return out;
}

export function write(files: OutputFile[]): void {
  for (const file of files) {
    mkdirSync(path.dirname(file.path), { recursive: true });
    writeFileSync(file.path, file.content);
  }
}

const lf = (text: string) => text.replace(/\r\n/g, "\n");

export function stale(files: OutputFile[]): string[] {
  return files
    .filter(
      (f) =>
        !existsSync(f.path) ||
        lf(readFileSync(f.path, "utf8")) !== lf(f.content),
    )
    .map((f) => f.path);
}
