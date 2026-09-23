# Art

Every icon in Ironbark is a 32×32 sprite. Peter's hand-drawn sprites are the source of truth;
`npm run sprites` produces everything else to match them.

```
art/
  hand-drawn/           Peter's Aseprite sources and PNG exports (was next-idle-sprites/)
    skills/             woodcutting, mining, firemaking, fletching
    items/logs/         the eight logs
    items/weapons/      the six swords
    overrides/          drop <id>.png here to replace any generated sprite
  generator/
    make.mjs            the generator
    png.mjs             tiny PNG reader/writer (no dependencies)
```

`npm run sprites` writes `public/icons/<id>.png` and `src/content/sprite-manifest.json`
(which records who made each sprite). CI fails if the committed icons are out of date.

## How sprites are made

| Provenance | What it means | Examples |
| --- | --- | --- |
| `peter` | Hand-drawn, used as-is | logs, swords, skill icons |
| `derived` | Recoloured or reshaped from a hand-drawn sprite | Verdite/Nightsteel swords, daggers (shorter blade), greatswords (wider blade), pickaxes (from the Mining icon), arrows (from the Fletching icon) |
| `generated` | Drawn by the generator to the same rules | armour, bars, ores, axes, bows, rods, trees, fish |

Rules taken from the hand-drawn set:

- 32×32 canvas, subject on the diagonal; shown only at 1×, 2× or 4×.
- Outlines use the material's own darkest tones: lighter on the top-left, darker on the bottom-right. Never black.
- A highlight line sits just inside the lit edge, then mid tones, then a reflected tone before the shadow edge.
- Wooden handles are 3 px: one `#994b3d` and two `#663229`.
- Tiers escalate: plain guards (1–4), winged guard and jewel (5–7), gold trim (8).
- Metal ramps are sampled from the swords' blades (row 8); wood ramps from the logs' bark and end grain.

## Replacing a generated sprite

1. Draw it in Aseprite at 32×32 and export a PNG named after the sprite id, with `:` written as `-`
   (for example `helm-5.png` for `helm:5`, `fish-3.png` for `fish:3`).
2. Put it in `art/hand-drawn/overrides/`.
3. Run `npm run sprites`. Hand-drawn always wins; the manifest marks it as `peter`.

Sprite ids are listed at `/dev/sprites` in the running app.
