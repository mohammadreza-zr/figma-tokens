import { defineConfig } from "@mrzr/figma-tokens";

export default defineConfig({
  input: "tokens",
  outDir: "generated",
  primitives: { keep: ["white", "black"] },
  fontSans: "font-fa-primary",
  aliases: {
    primary: "brand-primary",
    "primary-foreground": "brand-on-primary",
    background: "neutral-background",
    foreground: "neutral-on-background",
    destructive: "status-error",
  },
  extra: "  --radius: var(--radius-md);",
});
