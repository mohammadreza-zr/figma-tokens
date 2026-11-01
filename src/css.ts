import { oklch } from "culori";
import StyleDictionary from "style-dictionary";
import type { Tree } from "./clean.js";
import type { ResolvedConfig } from "./config.js";

export const kebab = (segs: readonly string[]): string =>
  segs
    .filter((s) => String(s).toLowerCase() !== "root")
    .map((s) =>
      String(s)
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/\s+/g, "-")
        .toLowerCase(),
    )
    .join("-");

const valueOf = (token: { $value?: unknown; value?: unknown }) =>
  token.$value ?? token.value;

const first = (token: { path: string[] }) => token.path[0].toLowerCase();

export async function buildCss(
  tokens: Tree,
  config: ResolvedConfig,
): Promise<string> {
  try {
    return await run(structuredClone(tokens), config, "silent");
  } catch {
    // Style Dictionary only names the broken reference in verbose mode.
    return run(structuredClone(tokens), config, "verbose");
  }
}

async function run(
  tokens: Tree,
  config: ResolvedConfig,
  verbosity: "silent" | "verbose",
): Promise<string> {
  const sd = new StyleDictionary({
    tokens,
    log: { verbosity },
    hooks: {
      transforms: {
        "name/kebab-no-root": {
          type: "name",
          transform: (token) => kebab(token.path),
        },
        "color/oklch": {
          type: "value",
          transitive: true,
          filter: (token) => {
            if ((token.$type ?? token.type) === "color") return true;
            const v = valueOf(token);
            return typeof v === "string" && /^(#|rgb|hsl|oklch)/i.test(v);
          },
          transform: (token) => {
            const v = valueOf(token);
            if (typeof v !== "string") return v;
            const c = oklch(v);
            if (!c) return v;
            const l = +(c.l ?? 0).toFixed(4);
            const ch = +(c.c ?? 0).toFixed(4);
            const h = c.h == null ? "none" : +c.h.toFixed(2);
            const alpha = c.alpha ?? 1;
            const a =
              alpha >= 0.9999 ? "" : ` / ${+alpha.toFixed(4) || 0.0001}`;
            return `oklch(${l} ${ch} ${h}${a})`;
          },
        },
        "size/px": {
          type: "value",
          filter: (token) =>
            ["radius", "text", "size", "sizes", ...config.px].includes(
              first(token),
            ),
          transform: (token) => {
            const v = valueOf(token);
            return typeof v === "number" ? `${v}px` : v;
          },
        },
        "duration/ms": {
          type: "value",
          filter: (token) => first(token) === "duration",
          transform: (token) => {
            const v = valueOf(token);
            if (typeof v === "number") return `${v}ms`;
            if (typeof v === "string") return /^\d+$/.test(v) ? `${v}ms` : v;
            if (v && typeof v === "object") {
              const o = v as Record<string, unknown>;
              const n = o.value ?? o.amount ?? o.duration;
              if (n != null) return `${n}${o.unit ?? "ms"}`;
            }
            return String(v);
          },
        },
        "font/quote": {
          type: "value",
          filter: (token) => first(token) === "font",
          transform: (token) => {
            const v = valueOf(token);
            return typeof v === "string" && !v.startsWith('"') ? `"${v}"` : v;
          },
        },
      },
    },
    platforms: {
      css: {
        transforms: [
          "name/kebab-no-root",
          "color/oklch",
          "size/px",
          "duration/ms",
          "font/quote",
        ],
        files: [
          {
            destination: config.css,
            format: "css/variables",
            options: { selector: config.selector, outputReferences: true },
          },
        ],
      },
    },
  });

  await sd.hasInitialized;
  const [file] = await sd.formatPlatform("css");
  return String(file.output);
}
