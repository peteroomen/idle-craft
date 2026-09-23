# Ironbark — notes for Claude Code

Ironbark is Peter's idle crafting RPG (Melvor-like), built on his `next-idle` app and hand-drawn sprites.
Read `README.md` for the overview and `art/README.md` for the sprite pipeline.

## Principles

- **Peter's work leads.** His sprites, UI shell (Silkscreen title, purple Ant Design theme, sidebar
  menu, activity cards with Start/Cancel, skill header with XP bar) and naming are the baseline.
  Extend them; don't replace them.
- **Content is data.** Every number lives in `src/content` (mostly `formulas.ts`). Don't hard-code
  balance values in the engine or UI.
- **The engine is pure.** `src/engine` never imports React, the DOM or `Date.now()`. Time is passed in.
  Randomness uses the seeded RNG stored in the save, so results are reproducible.
- **Offline equals online.** Offline progress is `advance(state, elapsedMs)` — the same code path as
  the live clock. Never add a separate offline formula.
- **Sprites come from the generator.** Run `npm run sprites` after changing `art/`. Hand-drawn
  overrides in `art/hand-drawn/overrides/` always win. Never hand-edit `public/icons/`.
- **Balance changes show in PRs.** After changing content or formulas, run `npm run balance` and commit
  `balance/report.md`.

## Current state

- M0–M6 shipped on branch `claude/melvor-idle-game-090oxo`: engine, 10 skills, shop, equipment,
  combat (8 zones × 3 monsters), balance report + simulator, PWA install, save export/import.
- Generated stand-ins still used for most skill icons and all monster sprites (see README).
- Not deployed yet.

## Commands

- `npm run check` before every commit (lint + typecheck + unit tests).
- `npm run test:e2e` runs Playwright against `out/`, so build first. In the cloud container set
  `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` and never run `playwright install`.
- `npm run build` must pass (static export; no server features: no API routes, no middleware,
  no `next/font/google`).
- Node 22 lives at `/opt/node22/bin` in the Claude Code cloud container.

## Conventions

- TypeScript strict. No `any`.
- Ant Design components for UI; Tailwind for layout utilities.
- Skill ids use Peter's spelling: `defense`, not `defence`.
- Sprites display at 1×, 2× or 4× (`Icon` sizes md/lg/xl) so pixels stay square.
- Money is integer gold. XP is stored as a number, levels are derived from it.
