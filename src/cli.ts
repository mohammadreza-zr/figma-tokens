#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { generate, stale, write } from "./build.js";
import { findConfig, loadConfig } from "./config.js";

const HELP = `figma-tokens — Figma design tokens to CSS variables and a Tailwind v4 theme

Usage:
  figma-tokens [build] [--config <file>] [--check]

Options:
  --config <file>  Config file (default: figma-tokens.config.mjs|js|json in the cwd)
  --check          Write nothing; exit 1 when the output on disk is out of date
  -v, --version    Print the version
  -h, --help       Show this help
`;

interface Args {
  check: boolean;
  help: boolean;
  version: boolean;
  config?: string;
}

function parse(argv: string[]): Args {
  const args: Args = { check: false, help: false, version: false };
  const rest = [...argv];
  if (rest[0] === "build") rest.shift();
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--check") args.check = true;
    else if (arg === "-h" || arg === "--help") args.help = true;
    else if (arg === "-v" || arg === "--version") args.version = true;
    else if (arg === "--config") {
      const value = rest[++i];
      if (!value) throw new Error("figma-tokens: --config needs a file");
      args.config = value;
    } else throw new Error(`figma-tokens: unknown argument "${arg}" (see --help)`);
  }
  return args;
}

async function main(argv: string[]): Promise<number> {
  const args = parse(argv);
  if (args.help) {
    process.stdout.write(HELP);
    return 0;
  }
  if (args.version) {
    const pkg = new URL("../package.json", import.meta.url);
    console.log((JSON.parse(readFileSync(pkg, "utf8")) as { version: string }).version);
    return 0;
  }

  const cwd = process.cwd();
  const file = findConfig(cwd, args.config);
  const config = await loadConfig(file);
  const files = await generate(config, path.dirname(file));

  if (args.check) {
    const old = stale(files);
    if (old.length === 0) {
      console.log("✔ tokens are up to date");
      return 0;
    }
    for (const f of old) console.error(`✖ out of date: ${path.relative(cwd, f)}`);
    console.error("Run `npx @mrzr/figma-tokens` and commit the result.");
    return 1;
  }

  write(files);
  for (const f of files) console.log(`✔ ${path.relative(cwd, f.path)}`);
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  },
);
