import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

export interface FigmaTokensConfig {
  /** Folder holding the Figma `*.json` exports (DTCG). */
  input: string;
  /** Folder the CSS files are written to. */
  outDir: string;
  /** File name of the CSS-variables output. */
  css?: string;
  /** File name of the Tailwind v4 theme output, or `false` to skip it. */
  tailwind?: string | false;
  /** Figma collection name -> the namespace used in variable names. Merged over the defaults. */
  collections?: Record<string, string>;
  /** Selector that carries the variables. Default `:root`. */
  selector?: string;
  /** Selector that flips the semantic colours to their dark values. Default `.dark`. */
  darkSelector?: string;
  /** Where the light/dark semantic colours live, below the `color` collection. */
  semantic?: { group?: string; light?: string; dark?: string };
  /** Which primitive colours get a utility of their own. */
  primitives?: { group?: string; keep?: string[] };
  /** Extra short names: `{ primary: "brand-primary" }` emits `--color-primary: var(--color-brand-primary)`. */
  aliases?: Record<string, string>;
  /** Namespaces whose plain numbers get `px`, on top of `radius`, `size`, `sizes` and `text`. */
  px?: string[];
  /** Variable (without `--`) that `--font-sans` points at. Omit to emit no `--font-sans`. */
  fontSans?: string;
  /** Raw CSS appended to the final `@theme inline` block of the Tailwind file. */
  extra?: string;
}

export interface ResolvedConfig {
  input: string;
  outDir: string;
  css: string;
  tailwind: string | false;
  collections: Record<string, string>;
  selector: string;
  darkSelector: string;
  semantic: { group: string; light: string; dark: string };
  primitives: { group: string; keep: string[] };
  aliases: Record<string, string>;
  px: string[];
  fontSans: string | undefined;
  extra: string;
}

export const DEFAULT_COLLECTIONS: Record<string, string> = {
  Colors: "color",
  Radius: "radius",
  Duration: "duration",
  Font: "font",
  Fonts: "font",
  Size: "size",
  Sizes: "size",
  Weight: "font-weight",
  Weights: "font-weight",
};

export function defineConfig(config: FigmaTokensConfig): FigmaTokensConfig {
  return config;
}

const OPTIONS = [
  "input",
  "outDir",
  "css",
  "tailwind",
  "collections",
  "px",
  "selector",
  "darkSelector",
  "semantic",
  "primitives",
  "aliases",
  "fontSans",
  "extra",
];

export function resolveConfig(config: FigmaTokensConfig): ResolvedConfig {
  for (const key of Object.keys(config)) {
    if (!OPTIONS.includes(key)) {
      throw new Error(
        `figma-tokens: unknown option "${key}" (options: ${OPTIONS.join(", ")})`,
      );
    }
  }
  if (!config.input) throw new Error("figma-tokens: `input` is required");
  if (!config.outDir) throw new Error("figma-tokens: `outDir` is required");
  return {
    input: config.input,
    outDir: config.outDir,
    css: config.css ?? "tokens.css",
    tailwind: config.tailwind ?? "tailwind.css",
    collections: { ...DEFAULT_COLLECTIONS, ...config.collections },
    selector: config.selector ?? ":root",
    darkSelector: config.darkSelector ?? ".dark",
    semantic: {
      group: config.semantic?.group ?? "semantic",
      light: config.semantic?.light ?? "light",
      dark: config.semantic?.dark ?? "dark",
    },
    primitives: {
      group: config.primitives?.group ?? "primitive",
      keep: (config.primitives?.keep ?? []).map((s) => s.toLowerCase()),
    },
    aliases: config.aliases ?? {},
    px: (config.px ?? []).map((s) => s.toLowerCase()),
    fontSans: config.fontSans,
    extra: config.extra ?? "",
  };
}

const CONFIG_NAMES = [
  "figma-tokens.config.yaml",
  "figma-tokens.config.yml",
  "figma-tokens.config.json",
  ".figma-tokensrc",
  ".figma-tokensrc.yaml",
  ".figma-tokensrc.yml",
  ".figma-tokensrc.json",
];

const SCRIPT = /\.(c|m)?(j|t)s$/;

export function findConfig(cwd: string, explicit?: string): string {
  if (explicit) {
    const file = path.resolve(cwd, explicit);
    if (!existsSync(file)) throw new Error(`figma-tokens: no config at ${file}`);
    return file;
  }
  for (const name of CONFIG_NAMES) {
    const file = path.resolve(cwd, name);
    if (existsSync(file)) return file;
  }
  throw new Error(
    `figma-tokens: no config found; create ${CONFIG_NAMES[0]} (see the README)`,
  );
}

export async function loadConfig(file: string): Promise<FigmaTokensConfig> {
  if (SCRIPT.test(file)) {
    throw new Error(
      `figma-tokens: ${file} is a script; the config must be YAML or JSON`,
    );
  }
  const text = readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const isJson = file.endsWith(".json");
  let parsed: unknown;
  try {
    parsed = isJson ? JSON.parse(text) : parseYaml(text);
  } catch (error) {
    throw new Error(
      `figma-tokens: ${file} is not valid ${isJson ? "JSON" : "YAML"} (${(error as Error).message})`,
    );
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`figma-tokens: ${file} must hold a mapping of options`);
  }
  return parsed as FigmaTokensConfig;
}
