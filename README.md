# Ironbark

An idle crafting RPG in the Melvor mould, grown from idle-craft. Pick a tree, close the tab,
come back to a bank full of logs.

- **Ten skills in v1:** Woodcutting, Mining, Fishing, Smithing, Fletching, Attack, Strength, Defense, Ranged, Hitpoints.
- **Eight tiers of everything**, unlocking at levels 1, 10, 20, 30, 45, 60, 75 and 90.
- **Idle for real:** the same engine runs live and catches up offline (12 h cap, 24 h with upgrades).
- **Balance you can read:** all numbers live in `src/content`; `npm run balance` turns them into XP/hour, gold/hour and time-to-99.

The design pitch lives at https://claude.ai/artifact/RY19r8MXVZjhU8zPptkPFt.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Use Node 22 (see `.nvmrc`). No environment variables or database are needed: the game saves in the browser.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Static export to `out/` (deploy anywhere) |
| `npm run check` | Lint, typecheck and unit tests |
| `npm run test:e2e` | Playwright smoke test against `out/` (run `npm run build` first) |
| `npm run sprites` | Rebuild every icon from `art/` (see `art/README.md`) |
| `npm run balance` | Rewrite `balance/report.md` from the game content |
| `npm run sim` | Play a bot through the real engine and print its progress |

The site works offline and installs to a phone home screen (web manifest + a small service worker).
Saves stay in the browser; Status → Save lets you export a save string, import one or start over.

## Layout

```
src/app/          Next.js pages (static export)
src/components/   UI components (Ant Design + Tailwind)
src/content/      Game data: tiers, items, activities, monsters, shop, formulas
src/engine/       Pure TypeScript game engine: state, advance(), actions, combat, save
src/store/        Zustand store and the game clock
art/              Hand-drawn sprites and the sprite generator
balance/          Balance report and simulator
tests/            Vitest (engine, content, balance) and Playwright (e2e)
```

## Status

Milestones M0–M6 from the pitch are done: all ten skills, 154 items, 24 monsters in 8 zones, the
shop, equipment, offline progress, the balance report (every rule passing) and install-to-phone.

Still to draw by hand (the generator stands in for now): skill icons for Fishing, Smithing,
Attack, Strength, Defense, Ranged and Hitpoints, and the 24 monster sprites. Drop them in
`art/hand-drawn/overrides/` and run `npm run sprites`.

Next up: dungeons, a world map, more skills (Cooking to turn raw fish into better food), and a deploy.

## History

This repo started as three working copies: `next-idle` (Next.js), `idle-craft` (an Nx API + web
split) and `next-idle-sprites` (Aseprite art). Ironbark builds on `next-idle` and the art; the Nx
workspace and the MongoDB/Auth.js code were removed and remain in git history.
