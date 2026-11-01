# CLAUDE.md

## Rule: output must stay stable

`tokens.css` of a real project's tokens must not change when this package changes. Compare the
output of the project the code was extracted from before and after any change to `src/css.ts`
or `src/clean.ts`.

## Rule: no project names

Nothing project-specific (a colour alias, a font variable, a collection spelling such as
`Premitive`) is written in `src/`. It belongs in the user's `figma-tokens.config`.

## Tests

Real fixtures in `test/fixtures`, no mocks. `npm test` builds and runs `node --test`.
