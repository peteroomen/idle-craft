// Ironbark art generator. Peter's hand-drawn 32x32 sprites are the source of truth;
// everything else is recoloured, derived or drawn here to match his conventions:
//   - lit outline top/left (O), darker outline bottom/right (o), highlight just inside (h), mid body (m)
//   - wooden handles are 3px diagonals: #994b3d with two #663229 pixels
//   - high tiers get jewels (T5-7) and a gold trim ring (T8)
// Provenance: 'peter' = hand-drawn, 'derived' = recoloured/reshaped from a hand-drawn sprite, 'generated' = drawn here.
// Run: npm run sprites  → writes public/icons/<id>.png and src/content/sprite-manifest.json
import { readPng, pngBuffer } from './png.mjs';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../hand-drawn/', import.meta.url));
const OVERRIDES = SRC + 'overrides/';
const OUT = fileURLToPath(new URL('../../public/icons/', import.meta.url));
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const N = 32;

// ---------- colour helpers ----------
const hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb2 = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = hex2(a), B = hex2(b); return rgb2(...A.map((v, i) => v + (B[i] - v) * t)); };
const rampFrom = (base) => ({ o: mix(base, '#140c1c', 0.6), O: mix(base, '#140c1c', 0.42), d: mix(base, '#140c1c', 0.2), m: base, l: mix(base, '#ffffff', 0.25), h: mix(base, '#ffffff', 0.5) });

// ---------- ramps ----------
// Metal ramps sampled from Peter's swords (blade row 8), plus the two new metals.
const METAL = {
  1: { name: 'Bronze', O: '#663d13', o: '#4d2d0f', h: '#f2b272', m: '#996b3d', d: '#805933' },
  2: { name: 'Iron', O: '#404040', o: '#303030', h: '#909090', m: '#606060', d: '#505050' },
  3: { name: 'Steel', O: '#595652', o: '#403e3b', h: '#b8cdd9', m: '#829199', d: '#6c7980' },
  4: { name: 'Verdite', O: '#2e5a2c', o: '#1d3b1f', h: '#c8f2a0', m: '#4d9a55', d: '#3c7a46' },
  5: { name: 'Mithril', O: '#535998', o: '#383c66', h: '#ffffff', l: '#e6e8ff', m: '#7c86cc', d: '#8c96e5' },
  6: { name: 'Orichalcum', O: '#6a3380', o: '#552966', h: '#ffffff', l: '#f8e6ff', m: '#b57acc', d: '#cb8ae6' },
  7: { name: 'Nightsteel', O: '#1f2a30', o: '#121a1f', h: '#d6fbff', l: '#8fbac6', m: '#2f3d45', d: '#44606b' },
  8: { name: 'Meteorite', O: '#802525', o: '#661e1e', h: '#ffffff', l: '#ffcccc', m: '#b35959', d: '#993d3d' },
};
for (const r of Object.values(METAL)) if (!r.l) r.l = mix(r.h, r.m, 0.45);
const JEWEL = {
  5: { q: '#3f5fb0', J: '#639bff', j: '#e6efff' }, 6: { q: '#ac3232', J: '#d95763', j: '#f6afb5' },
  7: { q: '#306082', J: '#5fcde4', j: '#e0fbff' }, 8: { q: '#8a6f30', J: '#fbf293', j: '#ffffff' },
};
const GOLD_TRIM = '#fbf293';
// Wood ramps from Peter's logs (bark + end grain), tiers in his order.
const WOOD = {
  1: { name: 'Pine', O: '#331c18', o: '#331c18', d: '#803e33', m: '#99664d', l: '#b37d47', h: '#fac693', leaf: ['#2b4d13', '#488020', '#6abe30'], shape: 'conifer' },
  2: { name: 'Oak', O: '#331c18', o: '#331c18', d: '#663229', m: '#994b3d', l: '#b37d47', h: '#fac693', leaf: ['#2a4716', '#4f832a', '#6abe30'], shape: 'tree' },
  3: { name: 'Birch', O: '#663229', o: '#663229', d: '#805519', m: '#99805c', l: '#ccbba3', h: '#fcf5eb', leaf: ['#488020', '#6abe30', '#99e550'], shape: 'tree' },
  4: { name: 'Teak', O: '#331c18', o: '#331c18', d: '#663229', m: '#b35f36', l: '#cc8f52', h: '#f8c998', leaf: ['#396619', '#488020', '#79c43a'], shape: 'tree' },
  5: { name: 'Maple', O: '#40150d', o: '#40150d', d: '#803426', m: '#b34836', l: '#b35f36', h: '#fac693', leaf: ['#7a1f10', '#e1491f', '#fa9e5d'], shape: 'tree' },
  6: { name: 'Mahogany', O: '#241513', o: '#241513', d: '#472721', m: '#7c482e', l: '#996837', h: '#e49440', leaf: ['#203511', '#35591c', '#4f832a'], shape: 'tree' },
  7: { name: 'Yew', O: '#33150f', o: '#33150f', d: '#4d1f17', m: '#803426', l: '#b35f36', h: '#ffb58e', leaf: ['#1b3312', '#2b4d13', '#488020'], shape: 'conifer' },
  8: { name: 'Magic', O: '#461980', o: '#461980', d: '#653d99', m: '#8e6bb3', l: '#d5cdeb', h: '#fcf5eb', leaf: ['#6e800d', '#b4cc29', '#ddfa37'], shape: 'tree', sparkle: '#b89ae6' },
};
const leafRamp = ([d, m, l]) => ({ O: mix(d, '#140c1c', 0.35), o: mix(d, '#140c1c', 0.5), d, m, l: mix(m, l, 0.6), h: l });
const STONE = { O: '#45444a', o: '#2f2d2e', d: '#595652', m: '#696a6a', l: '#847e87', h: '#9badb7' };
const LEATHER = { O: '#45283c', o: '#331c18', h: '#d9a066', l: '#b37d47', m: '#8f563b', d: '#663229' };
const GOLD = { O: '#8a6f30', o: '#5e4a1e', d: '#c49a2e', m: '#e8b830', l: '#fbe060', h: '#fff6b0' };
const HEART = { O: '#6a1a1a', o: '#4a1010', d: '#8a2626', m: '#ac3232', l: '#d95763', h: '#f6afb5' };
const FIXED = { a: '#994b3d', b: '#663229', G: '#45283c', g: '#8f563b', k: '#222034', S: '#eee4d0', r: '#d95763', R: '#ac3232', w: '#ffffff', M: '#847e87', n: '#595652', f: '#ed6148', F: '#f12400', y: '#fbf293' };
const FISH = {
  shrimp: { ramp: { o: '#6e2413', O: '#8a3020', d: '#c2462a', m: '#e0673f', l: '#f59a70', h: '#fcd0b0' }, fin: '#f59a70' },
  perch: { ramp: { o: '#2b3d13', O: '#3d5a1a', d: '#4b692f', m: '#8f974a', l: '#c8c26a', h: '#ece6a8' }, fin: '#df7126', stripe: '#3d5a1a', pattern: 'bars' },
  trout: { ramp: { o: '#333d31', O: '#4a5446', d: '#6a7a66', m: '#9aab98', l: '#c8d2c4', h: '#eef2ea' }, fin: '#7a8a76', stripe: '#e0829a', pattern: 'band-spots' },
  salmon: { ramp: { o: '#4d3034', O: '#6e4a4e', d: '#9a6a6e', m: '#c9a2a0', l: '#e8c8c0', h: '#fbeae4' }, fin: '#9a6a6e', stripe: '#f08a78', pattern: 'band' },
  tuna: { ramp: { o: '#0e1a33', O: '#1e3456', d: '#2d4a7a', m: '#3d6296', l: '#9aa8c8', h: '#dfe6f2' }, fin: '#e7c14a', stripe: '#e7c14a', pattern: 'finlets' },
  marlin: { ramp: { o: '#0c1640', O: '#1c2a64', d: '#2c4494', m: '#3656ae', l: '#7fb0f0', h: '#cfe2ff' }, fin: '#4e7ad6', stripe: '#9fc8ff', pattern: 'bars' },
  stormray: { ramp: { o: '#1a122b', O: '#2c2048', d: '#4a3480', m: '#6c4ca6', l: '#9a82d6', h: '#cdbcf5' }, fin: '#3a2a5e', stripe: '#f2e05a' },
  eel: { ramp: { o: '#052220', O: '#0c3a36', d: '#145a50', m: '#1f7a66', l: '#3fae8c', h: '#7fe0b8' }, fin: '#145a50', stripe: '#d6f56a' },
};

// ---------- grid helpers ----------
const blank = () => Array.from({ length: N }, () => Array(N).fill('.'));
const img = () => Array.from({ length: N }, () => Array(N).fill(null));
const inB = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
function fromText(rows) {
  const g = blank();
  rows.forEach((r, y) => { if (r.length > N) throw new Error('row too long: ' + r); [...r].forEach((c, x) => { g[y][x] = c; }); });
  return g;
}
const fill = (g, fn, ch) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (fn(x + 0.5, y + 0.5)) g[y][x] = ch; };
const circle = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
const ellipse = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
function polygon(pts) {
  return (x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
}
const set = (g, list, ch) => list.forEach(([x, y]) => { if (inB(x, y)) g[y][x] = ch; });
function line(g, x0, y0, x1, y1, ch) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) { const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n); if (inB(x, y)) g[y][x] = ch; }
}

// ---------- the shader ----------
// auto: { char: { ramp, mode } } — pixels with that char are shaded; any other non-'.' char is an explicit colour from `pal`.
function shade(g, auto, pal) {
  const out = img();
  const isOut = (c, x, y) => !inB(x, y) || g[y][x] === '.' || (g[y][x] !== c && auto[g[y][x]]);
  const run = (c, x, y, dx, dy) => { let n = 0; while (!isOut(c, x, y)) { x += dx; y += dy; n++; } return n; };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const c = g[y][x];
    if (c === '.') continue;
    if (!auto[c]) { out[y][x] = pal[c] ?? '#ff00ff'; continue; }
    const { ramp, mode } = auto[c];
    const up = isOut(c, x, y - 1), left = isOut(c, x - 1, y), down = isOut(c, x, y + 1), right = isOut(c, x + 1, y);
    if (up || left || down || right) { out[y][x] = (down || right) ? ramp.o : ramp.O; continue; }
    if (mode === 'belly') {
      const du = run(c, x, y, 0, -1), dd = run(c, x, y, 0, 1), t = du / (du + dd);
      out[y][x] = dd === 1 ? ramp.h : t < 0.34 ? ramp.d : t < 0.62 ? ramp.m : t < 0.85 ? ramp.l : ramp.h;
      continue;
    }
    const lit = Math.min(run(c, x, y, 0, -1), run(c, x, y, -1, 0));
    const shadow = Math.min(run(c, x, y, 0, 1), run(c, x, y, 1, 0));
    out[y][x] = lit === 1 ? ramp.h : shadow === 1 ? ramp.d : lit / (lit + shadow) < 0.42 ? ramp.l : ramp.m;
  }
  return out;
}
function goldRing(im, color = GOLD_TRIM) {
  const o = im.map((r) => r.slice());
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (im[y][x]) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inB(x + dx, y + dy) && im[y + dy][x + dx])) o[y][x] = color;
  }
  return o;
}
const recolor = (im, map) => im.map((r) => r.map((c) => (c && map[c.toLowerCase()] !== undefined ? map[c.toLowerCase()] : c)));
const shift = (im, dx, dy) => { const o = img(); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (im[y][x] && inB(x + dx, y + dy)) o[y + dy][x + dx] = im[y][x]; return o; };

// ---------- sprite registry ----------
const sprites = {}; // id -> { px, by: 'peter' | 'derived' | 'claude' }
const put = (id, px, by) => { sprites[id] = { px, by }; };
const peter = (path) => readPng(SRC + path).px;

// Peter's originals
['woodcutting', 'mining', 'firemaking', 'fletching'].forEach((s) => put(`skill:${s}`, peter(`skills/${s}.png`), 'peter'));
['pine log', 'oak log', 'birch log', 'teak-log', 'maple log', 'mahogany-log', 'yew log', 'magic log'].forEach((f, i) => put(`log:${i + 1}`, peter(`items/logs/${f}.png`), 'peter'));
const SWORD_FILES = { 1: 'bronze sword', 2: 'iron sword', 3: 'steel sword', 5: 'mithril sword', 6: 'orichalcum sword', 8: 'asteroid sword' };
for (const [t, f] of Object.entries(SWORD_FILES)) put(`sword:${t}`, peter(`items/weapons/${f}.png`), 'peter');

// New metals: recolour his swords. Verdite from bronze (plain guard), Nightsteel from orichalcum (winged guard + jewel).
{
  const b = METAL[1], v = METAL[4];
  put('sword:4', recolor(sprites['sword:1'].px, { [b.o]: v.o, [b.O]: v.O, [b.d]: v.d, [b.m]: v.m, [b.h]: v.h }), 'derived');
  const o = METAL[6], nn = METAL[7], jo = JEWEL[6], jn = JEWEL[7];
  put('sword:7', recolor(sprites['sword:6'].px, { [o.o]: nn.o, [o.O]: nn.O, [o.m]: nn.m, [o.d]: nn.d, [o.l]: nn.l, [o.h]: nn.h, [jo.q]: jn.q, [jo.J]: jn.J, [jo.j]: jn.j }), 'derived');
}
// Daggers: cut 7 rows out of the blade and slide the tip down to the guard.
for (let t = 1; t <= 8; t++) {
  const s = sprites[`sword:${t}`].px, o = img();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (y >= 15) o[y][x] = s[y][x];
    else if (y >= 9) o[y][x] = x < 27 - y ? s[y][x] : (inB(x + 7, y - 7) ? s[y - 7][x + 7] : null);
  }
  put(`dagger:${t}`, o, 'derived');
}
// Greatswords: widen every blade row by two pixels of mid-tone, then nudge down-left to stay on canvas.
for (let t = 1; t <= 8; t++) {
  const s = sprites[`sword:${t}`].px, o = s.map((r) => r.slice());
  for (let y = 1; y <= 19; y++) {
    const start = 27 - y; let end = start;
    while (end < N && s[y][end] === null) end++;
    if (end >= N) continue;
    const runStart = end; while (end < N && s[y][end] !== null) end++;
    const run = s[y].slice(runStart, end); if (run.length < 3) continue;
    const mid = Math.floor(run.length / 2);
    const widened = [...run.slice(0, mid + 1), run[mid], run[mid], ...run.slice(mid + 1)];
    for (let x = runStart; x < N; x++) o[y][x] = widened[x - runStart] ?? null;
  }
  put(`greatsword:${t}`, shift(o, -1, 1), 'derived');
}
// Pickaxes from his mining icon; arrows from his fletching icon (metal parts recoloured).
{
  const mining = sprites['skill:mining'].px, fl = sprites['skill:fletching'].px;
  for (let t = 1; t <= 8; t++) {
    const m = METAL[t];
    let p = recolor(mining, { '#829199': m.l, '#696a6a': m.m, '#595652': m.o });
    let a = recolor(fl, { '#829199': m.l, '#595652': m.o });
    if (t === 8) { p = goldRing(p); }
    put(`pickaxe:${t}`, p, 'derived');
    put(`arrows:${t}`, a, 'derived');
  }
}

// ---------- drawn in his style ----------
const metalPal = (t) => ({ ...FIXED, ...METAL[t], ...(JEWEL[t] ?? { q: METAL[t].d, J: METAL[t].m, j: METAL[t].h }) });
function metalItem(id, t, g, extraAuto = {}) {
  const auto = { '#': { ramp: METAL[t] }, '$': { ramp: METAL[t] }, '&': { ramp: METAL[t] }, '+': { ramp: METAL[t] }, L: { ramp: LEATHER }, ...extraAuto };
  let px = shade(g, auto, metalPal(t));
  if (t === 8) px = goldRing(px);
  put(`${id}:${t}`, px, 'generated');
}
const rowsOf = (spec) => { const g = blank(); spec.forEach(([y, x0, x1, ch]) => { for (let x = x0; x <= x1; x++) g[y][x] = ch; }); return g; };

// Bar (ingot): explicit faces, lit from the top left.
const BAR = [
  '', '', '', '', '', '', '', '', '', '',
  '..........OOOOOOOOOOOO',
  '.........Ohhhhhhhhhhhho',
  '........Ohllllllllllllllo',
  '.......Ohllllllllllllllllo',
  '......Ohlllllllllllllllllo',
  '.....Ohhhhhhhhhhhhhhhhhhhho',
  '.....Olmmmmmmmmmmmmmmmmmmdo',
  '.....Olmmmmmmmmmmmmmmmmmmdo',
  '.....Ommmmmmmmmmmmmmmmmmmdo',
  '.....Odddddddddddddddddddd o',
  '......oooooooooooooooooooo',
].map((r) => r.replace(/ /g, ''));
// Axe: his 3px handle, a flared head with the edge on the left.
function axeGrid() {
  const g = blank();
  for (let y = 4; y <= 28; y++) { const x = 31 - y; g[y][x] = 'a'; if (y < 28) { g[y][x + 1] = 'b'; g[y][x + 2] = 'b'; } }
  const head = [[2, 16, 20], [3, 13, 22], [4, 12, 24], [5, 12, 25], [6, 12, 24], [7, 12, 23], [8, 12, 22], [9, 12, 21], [10, 12, 20], [11, 13, 19], [12, 14, 18], [13, 16, 17]];
  head.forEach(([y, x0, x1]) => { for (let x = x0; x <= x1; x++) g[y][x] = '#'; });
  [[5, 28], [6, 28], [6, 27], [7, 27]].forEach(([y, x]) => { g[y][x] = '#'; });
  return g;
}
const HELM = rowsOf([
  [5, 12, 19, '#'], [6, 10, 21, '#'], [7, 9, 22, '#'], [8, 8, 23, '#'], [9, 7, 24, '#'], [10, 7, 24, '#'],
  ...[11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((y) => [y, 6, 25, '#']), [24, 5, 26, '&'], [25, 5, 26, '&'], [26, 6, 25, '&'],
]);
for (let y = 6; y <= 13; y++) { HELM[y][15] = 'h'; HELM[y][16] = 'd'; }
for (let x = 8; x <= 23; x++) if (x < 15 || x > 16) { HELM[15][x] = 'k'; HELM[16][x] = 'k'; }
[[9, 19], [11, 19], [13, 19], [18, 19], [20, 19], [22, 19], [9, 21], [11, 21], [13, 21], [18, 21], [20, 21], [22, 21]].forEach(([x, y]) => { HELM[y][x] = 'k'; });
[[15, 12], [16, 12], [15, 13], [16, 13]].forEach(([x, y], i) => { HELM[y][x] = i === 0 ? 'j' : 'J'; });

const BODY = rowsOf([
  [5, 6, 11, '&'], [5, 20, 25, '$'], [6, 5, 12, '&'], [6, 19, 26, '$'], [7, 4, 12, '&'], [7, 19, 27, '$'],
  [8, 4, 11, '&'], [8, 20, 27, '$'], [9, 4, 10, '&'], [9, 21, 27, '$'], [10, 4, 9, '&'], [10, 22, 27, '$'], [11, 4, 8, '&'], [11, 23, 27, '$'],
  [7, 13, 13, '#'], [7, 18, 18, '#'], [8, 12, 19, '#'], [9, 11, 20, '#'], [10, 10, 21, '#'], [11, 9, 22, '#'],
  ...[12, 13, 14, 15, 16, 17, 18, 19].map((y) => [y, 7, 24, '#']), [20, 8, 23, '#'],
  [21, 8, 23, 'L'], [22, 8, 23, 'L'], [23, 8, 15, '+'], [23, 16, 23, '+'], [24, 9, 15, '+'], [24, 16, 22, '+'], [25, 10, 14, '+'], [25, 17, 21, '+'],
]);
for (let y = 9; y <= 20; y++) { BODY[y][15] = 'h'; BODY[y][16] = 'd'; }
[[15, 21], [16, 21], [15, 22], [16, 22]].forEach(([x, y], i) => { BODY[y][x] = i === 0 ? 'j' : 'J'; });

const LEGS = rowsOf([
  [5, 6, 25, '&'], [6, 6, 25, '&'], [7, 6, 25, '&'],
  ...[8, 9, 10, 11, 12, 13, 14].map((y) => [y, 6, 15, '#']), ...[8, 9, 10, 11, 12, 13, 14].map((y) => [y, 16, 25, '$']),
  [15, 7, 15, '+'], [16, 7, 15, '+'], [17, 7, 15, '+'], [15, 16, 24, '&'], [16, 16, 24, '&'], [17, 16, 24, '&'],
  ...[18, 19, 20, 21, 22, 23, 24, 25].map((y) => [y, 8, 14, '#']), ...[18, 19, 20, 21, 22, 23, 24, 25].map((y) => [y, 17, 23, '$']),
  [26, 7, 15, '+'], [26, 16, 24, '+'],
]);
[[15, 6], [16, 6]].forEach(([x, y]) => { LEGS[y][x] = 'J'; });

const BOOTS = rowsOf([
  [8, 3, 12, 'L'], [9, 3, 12, 'L'], ...[10, 11, 12, 13, 14, 15, 16, 17].map((y) => [y, 4, 11, '#']), [18, 4, 13, '#'], [19, 4, 14, '#'], [20, 4, 15, '#'], [21, 4, 15, '#'], [22, 3, 15, 'k'],
  [11, 16, 25, 'L'], [12, 16, 25, 'L'], ...[13, 14, 15, 16, 17, 18, 19, 20].map((y) => [y, 17, 24, '$']), [21, 17, 26, '$'], [22, 17, 27, '$'], [23, 17, 28, '$'], [24, 17, 28, '$'], [25, 16, 28, 'k'],
]);
const SHIELD = rowsOf([
  [3, 7, 24, '#'], ...[4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((y) => [y, 6, 25, '#']), [14, 7, 24, '#'], [15, 7, 24, '#'], [16, 8, 23, '#'], [17, 8, 23, '#'],
  [18, 9, 22, '#'], [19, 10, 21, '#'], [20, 10, 21, '#'], [21, 11, 20, '#'], [22, 12, 19, '#'], [23, 13, 18, '#'], [24, 14, 17, '#'], [25, 15, 16, '#'],
]);
for (let y = 6; y <= 21; y++) { SHIELD[y][15] = 'h'; SHIELD[y][16] = 'l'; }
for (let x = 9; x <= 22; x++) { SHIELD[10][x] = 'h'; SHIELD[11][x] = 'l'; }
[[15, 10], [16, 10], [15, 11], [16, 11]].forEach(([x, y], i) => { SHIELD[y][x] = i === 0 ? 'j' : i === 3 ? 'q' : 'J'; });
const ANVIL = rowsOf([
  [9, 9, 27, '#'], [10, 4, 27, '#'], [11, 3, 27, '#'], [12, 5, 27, '#'], [13, 10, 25, '#'], [14, 12, 23, '#'], [15, 13, 22, '#'], [16, 13, 22, '#'],
  [17, 12, 23, '#'], [18, 10, 25, '#'], [19, 9, 26, '#'], [20, 9, 26, '#'], [21, 8, 27, '#'],
]);

for (let t = 1; t <= 8; t++) {
  metalItem('bar', t, fromText(BAR));
  metalItem('axe', t, axeGrid());
  metalItem('helm', t, HELM);
  metalItem('platebody', t, BODY);
  metalItem('platelegs', t, LEGS);
  metalItem('boots', t, BOOTS);
  metalItem('shield', t, SHIELD);
}
put('icon:smithing', shade(ANVIL, { '#': { ramp: METAL[2] } }, FIXED), 'generated');

// Arrowtips: three heads pointing up-right, in the metal. Shafts: a bundle of bare sticks.
const TIPS = blank();
[[8, 22], [15, 15], [22, 8]].forEach(([x, y]) => {
  fill(TIPS, polygon([[x + 6, y - 6], [x + 2, y + 3], [x, y + 1], [x - 1, y + 3], [x - 3, y + 1], [x - 1, y], [x - 3, y - 2], [x - 1, y - 3], [x, y - 1], [x + 1, y - 4]]), '#');
  set(TIPS, [[x - 2, y + 2], [x - 3, y + 3]], 'b');
});
for (let t = 1; t <= 8; t++) metalItem('arrowtips', t, TIPS);
{
  const g = blank();
  [[3, 24], [6, 27], [9, 30]].forEach(([x0, y0]) => { for (let i = 0; i < 21; i++) { const x = x0 + i, y = y0 - 3 - i; if (inB(x, y)) g[y][x] = 'p'; if (inB(x + 1, y)) g[y][x + 1] = 'P'; } });
  put('shafts', shade(g, {}, { p: '#d9a066', P: '#8f563b' }), 'generated');
}

// Ores: a stone lump with nuggets in the ore's colours.
const ORE_FLECK = {
  copper: ['#fa9e5d', '#df7126', '#8a3b12'], tin: ['#ffffff', '#cbdbfc', '#9badb7'], iron: ['#e8a878', '#b35f36', '#803426'], coal: ['#6a6a70', '#222034', '#0b0a12'],
};
const ORE_SHAPE = rowsOf([[8, 12, 17], [9, 10, 20], [10, 8, 22], [11, 7, 23], [12, 6, 24], [13, 5, 25], [14, 5, 26], [15, 4, 26], [16, 4, 27], [17, 4, 27], [18, 4, 27], [19, 4, 27], [20, 4, 26], [21, 5, 26], [22, 5, 25], [23, 6, 24], [24, 8, 22]].map(([y, a, b]) => [y, a, b, 'X']));
const NUGGETS = [[10, 12, 1], [11, 12, 0], [10, 13, 2], [11, 13, 1], [12, 13, 2], [18, 11, 0], [19, 11, 1], [18, 12, 1], [19, 12, 2], [14, 17, 1], [15, 17, 0], [13, 18, 2], [14, 18, 1], [15, 18, 1], [16, 18, 2], [14, 19, 2], [15, 19, 2], [21, 16, 0], [22, 16, 1], [21, 17, 1], [22, 17, 2], [8, 20, 1], [9, 20, 0], [8, 21, 2], [9, 21, 2], [20, 21, 1], [21, 21, 2]];
function ore(id, fleck) {
  const g = ORE_SHAPE.map((r) => r.slice());
  NUGGETS.forEach(([x, y, i]) => { g[y][x] = 'u' + i; });
  const pal = { u0: fleck[0], u1: fleck[1], u2: fleck[2] };
  const gg = g.map((r) => r.map((c) => (c.startsWith('u') ? c : c)));
  // shade needs single-char keys; map nugget codes to 1/2/3
  const g2 = gg.map((r) => r.map((c) => (c === 'u0' ? '1' : c === 'u1' ? '2' : c === 'u2' ? '3' : c)));
  put(id, shade(g2, { X: { ramp: STONE } }, { 1: pal.u0, 2: pal.u1, 3: pal.u2 }), 'generated');
}
ore('ore:1', ORE_FLECK.copper); ore('ore:tin', ORE_FLECK.tin); ore('ore:2', ORE_FLECK.iron); ore('ore:3', ORE_FLECK.coal);
for (const t of [4, 5, 6, 7]) ore(`ore:${t}`, [METAL[t].h, METAL[t].l, METAL[t].m]);
ore('ore:8', ['#fbf293', '#b35959', '#661e1e']);

// Bows and rods in each wood.
function bow(kind, t) {
  const g = blank();
  const [A, B, C] = kind === 'longbow' ? [[28, 3], [3, 28], [7, 7]] : [[24, 5], [5, 24], [5, 5]];
  const pts = [];
  for (let i = 0; i <= 200; i++) { const s = i / 200; pts.push([(1 - s) ** 2 * A[0] + 2 * (1 - s) * s * C[0] + s * s * B[0], (1 - s) ** 2 * A[1] + 2 * (1 - s) * s * C[1] + s * s * B[1], s]); }
  line(g, A[0] + 1, A[1] + 1, B[0] + 1, B[1] + 1, 'S');
  pts.forEach(([x, y, s]) => { const r = 1.9 - 0.9 * Math.abs(s - 0.5); fill(g, circle(x, y, r), Math.abs(s - 0.5) < 0.08 ? 'L' : 'W'); });
  const W = WOOD[t];
  put(`${kind}:${t}`, shade(g, { W: { ramp: { O: W.d, o: W.o, h: W.h, l: W.l, m: W.l, d: W.m } }, L: { ramp: LEATHER } }, { ...FIXED, S: '#d8cdb8' }), 'generated');
}
function rod(t) {
  const g = blank();
  for (let y = 6; y <= 28; y++) { const x = 32 - y; g[y][x] = y >= 22 ? 'g' : 'p'; if (y < 28) g[y][x + 1] = y >= 22 ? 'G' : 'P'; }
  set(g, [[9, 21], [10, 21], [9, 22], [10, 22], [11, 22]], 'M');
  set(g, [[10, 23], [11, 23]], 'n');
  for (let y = 7; y <= 18; y++) g[y][28] = 'S';
  set(g, [[27, 19], [28, 19], [29, 19], [28, 20]], 'r'); set(g, [[27, 21], [28, 21], [29, 21], [28, 22]], 'w');
  const W = WOOD[t];
  put(`rod:${t}`, shade(g, {}, { ...FIXED, p: W.l, P: W.o }), 'generated');
}
for (let t = 1; t <= 8; t++) { bow('shortbow', t); bow('longbow', t); rod(t); }

// Trees: canopy with dappled leaves + a trunk in the tier's bark.
function tree(t) {
  const W = WOOD[t], g = blank();
  let rs = t * 7919; const rnd = () => ((rs = (rs * 16807) % 2147483647) / 2147483647);
  if (W.shape === 'conifer') {
    fill(g, polygon([[15.5, 29], [13, 29], [14, 22], [17, 22], [18, 29]]), 'W');
    [[2, 10, 6], [6, 16, 9], [11, 23, 12]].forEach(([top, base, hw]) => fill(g, polygon([[16, top], [16 + hw, base], [16 - hw, base]]), 'V'));
  } else {
    fill(g, polygon([[13, 30], [19, 30], [18, 26], [17.5, 18], [14.5, 18], [14, 26]]), 'W');
    [[16, 10, 8], [9.5, 14, 6], [22.5, 14, 6], [16, 16, 7], [12, 7.5, 4.5], [20, 7.5, 4.5]].forEach(([x, y, r]) => fill(g, circle(x, y, r), 'V'));
  }
  const lr = leafRamp(W.leaf);
  let px = shade(g, { V: { ramp: lr }, W: { ramp: { ...W, O: W.o } } }, FIXED);
  for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
    if (g[y][x] !== 'V' || [g[y - 1][x], g[y + 1][x], g[y][x - 1], g[y][x + 1]].some((c) => c !== 'V')) continue;
    const r = rnd();
    if (r < 0.1) px[y][x] = lr.d; else if (r < 0.17) px[y][x] = lr.l;
    if (W.sparkle && r > 0.95) px[y][x] = W.sparkle;
  }
  put(`tree:${t}`, px, 'generated');
}
for (let t = 1; t <= 8; t++) tree(t);

// Fish.
function fishSprite(id, species, kind) {
  const F = FISH[species], g = blank();
  if (kind === 'fish' || kind === 'sail') {
    const long = kind === 'sail';
    const [cx, rx, ry] = long ? [14, 11, 4.6] : [14, 10, 5.6];
    fill(g, polygon([[22, 16], [29, 9], [27, 16], [29, 23]]), 'T');
    if (long) fill(g, polygon([[8, 13], [11, 4], [21, 7], [22, 13]]), 'T'); else fill(g, polygon([[10, 12], [13, 8], [18, 8], [19, 12]]), 'T');
    fill(g, polygon([[12, 20], [15, 25], [17, 20]]), 'T');
    fill(g, ellipse(cx, 16, rx, ry), 'B');
    if (long) line(g, 0, 16, 4, 16, 'T');
    const eye = long ? [6, 14] : [7, 14];
    set(g, [[eye[0], eye[1]]], 'w'); set(g, [[eye[0] + 1, eye[1]], [eye[0], eye[1] + 1], [eye[0] + 1, eye[1] + 1]], 'k');
    set(g, [[11, 13], [12, 14], [12, 15], [12, 16], [12, 17], [11, 18]], 'z');
    if (F.pattern === 'bars') [15, 18, 21].forEach((x) => { for (let y = 12; y <= 18; y++) if (g[y][x] === 'B') g[y][x] = 's'; });
    if (F.pattern === 'band' || F.pattern === 'band-spots') for (let x = 9; x <= 22; x++) if (g[16][x] === 'B') g[16][x] = 's';
    if (F.pattern === 'band-spots') set(g, [[14, 13], [17, 14], [20, 13], [16, 18], [19, 19]], 'x');
    if (F.pattern === 'finlets') set(g, [[18, 11], [20, 11], [18, 21], [20, 21]], 's');
  } else if (kind === 'shrimp') {
    for (let i = 0; i <= 40; i++) { const a = Math.PI * (1.15 - 1.25 * (i / 40)), r = 8; const x = 16 + r * Math.cos(a), y = 17 - r * Math.sin(a); fill(g, circle(x, y, 3.6 - 1.6 * (i / 40)), 'B'); }
    fill(g, polygon([[20, 23], [26, 27], [21, 28], [17, 27]]), 'T');
    for (let i = 0; i < 5; i++) { const a = Math.PI * (1.0 - 0.22 * i); const x = Math.round(16 + 8 * Math.cos(a)), y = Math.round(17 - 8 * Math.sin(a)); if (inB(x, y) && g[y][x] === 'B') g[y][x] = 'z'; }
    line(g, 7, 13, 1, 4, 's'); line(g, 8, 12, 4, 3, 's');
    set(g, [[8, 15]], 'k'); set(g, [[7, 20], [9, 21], [11, 22]], 's');
  } else if (kind === 'ray') {
    line(g, 16, 22, 29, 30, 'T'); line(g, 17, 22, 30, 30, 'T');
    fill(g, polygon([[16, 3], [29, 14], [16, 24], [3, 14]]), 'B');
    set(g, [[12, 10], [19, 10]], 'k');
    set(g, [[10, 14], [14, 17], [19, 13], [22, 16], [16, 20], [16, 8], [8, 15], [24, 14]], 'x');
  } else if (kind === 'eel') {
    for (let x = 3; x <= 29; x++) { const cy = 16 - 5 * Math.sin(((x - 3) / 26) * Math.PI * 2); fill(g, circle(x, cy, x > 25 ? 1.6 : 2.8), 'B'); }
    set(g, [[5, 15]], 'k'); for (let x = 8; x <= 26; x += 3) { const cy = Math.round(16 - 5 * Math.sin(((x - 3) / 26) * Math.PI * 2)); if (g[cy][x] === 'B') g[cy][x] = 'x'; }
  }
  const pal = { ...FIXED, s: F.stripe ?? F.ramp.l, z: F.ramp.d, x: F.stripe ?? F.ramp.h };
  if (species === 'trout') pal.x = F.ramp.o;
  put(id, shade(g, { B: { ramp: F.ramp, mode: kind === 'ray' ? undefined : 'belly' }, T: { ramp: rampFrom(F.fin) } }, pal), 'generated');
}
fishSprite('fish:1', 'shrimp', 'shrimp'); fishSprite('fish:2', 'perch', 'fish'); fishSprite('fish:3', 'trout', 'fish'); fishSprite('fish:4', 'salmon', 'fish');
fishSprite('fish:5', 'tuna', 'fish'); fishSprite('fish:6', 'marlin', 'sail'); fishSprite('fish:7', 'stormray', 'ray'); fishSprite('fish:8', 'eel', 'eel');

// Coin and heart.
{
  const g = blank(); fill(g, circle(16, 16, 10), 'Y');
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 16); if (d > 6.2 && d < 7.2 && g[y][x] === 'Y') g[y][x] = 'e'; }
  for (let y = 12; y <= 20; y++) { g[y][15] = 'E'; g[y][16] = 'e'; } set(g, [[13, 12], [14, 12], [17, 12], [18, 12], [13, 20], [14, 20], [17, 20], [18, 20]], 'e');
  put('coin', shade(g, { Y: { ramp: GOLD } }, { e: GOLD.d, E: GOLD.h }), 'generated');
  const h = blank(); fill(h, circle(11, 12, 6), 'H'); fill(h, circle(21, 12, 6), 'H'); fill(h, polygon([[5.4, 14], [26.6, 14], [16, 27]]), 'H');
  set(h, [[9, 9], [10, 9], [8, 10]], 'w');
  put('heart', shade(h, { H: { ramp: HEART } }, FIXED), 'generated');
}

// ---------- Monsters: ten shapes, recoloured per monster ----------
// Regions: A = skin/fur/shell, B = clothes/second colour, C = legs/third colour; k = eyes.
function creature(shape) {
  const g = blank();
  const leg = (x, y0, y1, w, ch) => { for (let y = y0; y <= y1; y++) for (let dx = 0; dx < w; dx++) g[y][x + dx] = ch; };
  switch (shape) {
    case 'humanoid':
    case 'giant': {
      const big = shape === 'giant';
      const [hx, hy, hr] = big ? [16, 6.5, 4.2] : [16, 7, 3.4];
      const [t0, t1, tw] = big ? [11, 21, 6.5] : [11, 20, 4.5];
      fill(g, polygon([[16 - tw, t0], [16 + tw, t0], [16 + tw - 1, t1], [16 - tw + 1, t1]]), 'B');
      fill(g, polygon([[16 - tw - 3.5, t0 + 1], [16 - tw, t0], [16 - tw, t0 + 8], [16 - tw - 2, t0 + 10]]), 'B');
      fill(g, polygon([[16 + tw + 3.5, t0 + 1], [16 + tw, t0], [16 + tw, t0 + 8], [16 + tw + 2, t0 + 10]]), 'B');
      fill(g, circle(16 - tw - 2.5, t0 + 11, big ? 1.8 : 1.4), 'A');
      fill(g, circle(16 + tw + 2.5, t0 + 11, big ? 1.8 : 1.4), 'A');
      leg(big ? 11 : 12, t1 + 1, 28, big ? 4 : 3, 'C');
      leg(big ? 17 : 17, t1 + 1, 28, big ? 4 : 3, 'C');
      fill(g, circle(hx, hy, hr), 'A');
      set(g, [[Math.round(hx - 1.5), Math.round(hy)], [Math.round(hx + 1), Math.round(hy)]], 'k');
      break;
    }
    case 'beast': {
      fill(g, ellipse(17, 17, 9, 5), 'A');
      fill(g, circle(8, 13, 4.2), 'A');
      fill(g, polygon([[1.5, 15], [6, 12.5], [6, 17]]), 'A');
      fill(g, polygon([[6, 10], [8, 5], [10, 10]]), 'A');
      fill(g, polygon([[25, 14], [31, 10], [30, 13], [26, 17]]), 'A');
      leg(10, 20, 27, 2, 'C'); leg(14, 21, 27, 2, 'C'); leg(20, 21, 27, 2, 'C'); leg(24, 20, 27, 2, 'C');
      fill(g, ellipse(17, 19, 7, 2.2), 'B');
      set(g, [[7, 12]], 'k');
      break;
    }
    case 'rat': {
      for (let i = 0; i <= 12; i++) set(g, [[18 + i, Math.round(24 - 3 * Math.sin(i / 3))]], 'C');
      fill(g, ellipse(15, 21, 8, 4.5), 'A');
      fill(g, circle(7, 19, 3.6), 'A');
      fill(g, polygon([[1.5, 21], [5, 18], [5, 22.5]]), 'A');
      fill(g, circle(8, 15.5, 1.8), 'B');
      leg(9, 24, 27, 2, 'C'); leg(19, 24, 27, 2, 'C');
      set(g, [[6, 18]], 'k');
      break;
    }
    case 'bird': {
      fill(g, ellipse(17, 18, 8, 7), 'A');
      fill(g, circle(10, 10, 4.2), 'A');
      fill(g, polygon([[3, 11], [7, 9.5], [7, 12.5]]), 'C');
      fill(g, polygon([[8, 5], [10, 3], [11, 6], [13, 4.5], [12.5, 8], [8.5, 8]]), 'B');
      fill(g, polygon([[24, 13], [30, 8], [29, 16], [25, 19]]), 'A');
      fill(g, ellipse(18, 18, 5, 3.5), 'B');
      leg(14, 25, 29, 1, 'C'); leg(19, 25, 29, 1, 'C');
      set(g, [[9, 9]], 'k');
      break;
    }
    case 'spider': {
      for (const [x0, y0, x1, y1, x2, y2] of [[12, 16, 5, 10, 2, 17], [12, 18, 4, 16, 2, 24], [13, 20, 6, 22, 4, 29], [15, 21, 10, 25, 9, 30], [20, 16, 27, 10, 30, 17], [20, 18, 28, 16, 30, 24], [19, 20, 26, 22, 28, 29], [17, 21, 22, 25, 23, 30]]) {
        line(g, x0, y0, x1, y1, 'C'); line(g, x1, y1, x2, y2, 'C');
      }
      fill(g, ellipse(16, 21, 7, 5.5), 'A');
      fill(g, circle(16, 13, 4.2), 'B');
      set(g, [[14, 12], [18, 12], [15, 14], [17, 14]], 'k');
      break;
    }
    case 'flyer': {
      fill(g, polygon([[15, 14], [1, 4], [4, 12], [2, 16], [9, 19], [15, 19]]), 'B');
      fill(g, polygon([[17, 14], [31, 4], [28, 12], [30, 16], [23, 19], [17, 19]]), 'B');
      fill(g, ellipse(16, 18, 4.5, 7), 'A');
      fill(g, circle(16, 9, 3.6), 'A');
      fill(g, polygon([[14.5, 11], [17.5, 11], [16, 15]]), 'C');
      fill(g, polygon([[13, 24], [19, 24], [21, 30], [16, 27], [11, 30]]), 'B');
      set(g, [[14, 9], [18, 9]], 'k');
      break;
    }
    case 'wyrm': {
      fill(g, polygon([[18, 14], [30, 2], [29, 12], [31, 17], [22, 19]]), 'B');
      for (let i = 0; i <= 40; i++) { const t = i / 40; fill(g, circle(24 - 16 * t + 3 * Math.sin(t * 6), 27 - 18 * t, 4.2 - 1.6 * t), 'A'); }
      fill(g, polygon([[3, 8], [9, 4], [13, 7], [12, 11], [5, 11]]), 'A');
      fill(g, polygon([[9, 4], [11, 0.5], [12, 5]]), 'C');
      fill(g, polygon([[5, 11], [9, 11], [7, 13]]), 'C');
      for (let i = 0; i < 6; i++) set(g, [[Math.round(22 - 2.6 * i), Math.round(24 - 3 * i)]], 'C');
      set(g, [[8, 7]], 'k');
      break;
    }
    case 'wraith': {
      fill(g, polygon([[8, 14], [16, 3], [24, 14], [25, 26], [22, 23], [19, 28], [16, 24], [13, 28], [10, 23], [7, 26]]), 'A');
      fill(g, circle(16, 11, 5.5), 'B');
      fill(g, polygon([[8, 16], [2, 22], [7, 20]]), 'A'); fill(g, polygon([[24, 16], [30, 22], [25, 20]]), 'A');
      set(g, [[14, 11], [18, 11], [14, 12], [18, 12]], 'k');
      break;
    }
    case 'treant': {
      leg(12, 22, 29, 3, 'C'); leg(18, 22, 29, 3, 'C');
      fill(g, polygon([[11, 12], [21, 12], [20, 23], [12, 23]]), 'C');
      fill(g, polygon([[11, 13], [3, 8], [5, 14], [10, 17]]), 'C');
      fill(g, polygon([[21, 13], [29, 8], [27, 14], [22, 17]]), 'C');
      [[16, 7, 6], [10, 8, 4], [22, 8, 4]].forEach(([x, y, r]) => fill(g, circle(x, y, r), 'A'));
      set(g, [[14, 16], [18, 16]], 'k'); set(g, [[15, 19], [16, 19], [17, 19]], 'k');
      break;
    }
  }
  return g;
}
const MONSTERS = {
  chicken: ['bird', '#ece4d8', '#d95763', '#e8b830'], giant_rat: ['rat', '#8a7a6a', '#d9a0a0', '#b8908a'], goblin: ['humanoid', '#6abe30', '#8f563b', '#4a3a2a'],
  wolf: ['beast', '#7a7a80', '#a8a8b0', '#5a5a60'], bandit: ['humanoid', '#d9a066', '#ac3232', '#3a3040'], giant_spider: ['spider', '#3a3040', '#5a4a6a', '#2a2030'],
  skeleton: ['humanoid', '#e8e0cc', '#d8d0bc', '#c8c0ac'], ghoul: ['humanoid', '#8fa888', '#4b5a48', '#3f4a3c'], barrow_knight: ['humanoid', '#829199', '#6c7980', '#4a5560'],
  mudcrab: ['spider', '#9a6a4a', '#b37d47', '#7a4a2a'], bog_troll: ['giant', '#7a8a4a', '#4b5a2f', '#5a4a2a'], sea_hag: ['wraith', '#5a9a8a', '#3a6a60', '#2a4a44'],
  frost_wolf: ['beast', '#cbdbfc', '#ffffff', '#9badb7'], yeti: ['giant', '#eef2f8', '#cbdbfc', '#b8c8e0'], ice_wraith: ['wraith', '#9fd8f0', '#e0f6ff', '#5fcde4'],
  magma_crawler: ['spider', '#df7126', '#fbf236', '#ac3232'], salamander: ['rat', '#e1491f', '#fa9e5d', '#ac3232'], fire_giant: ['giant', '#d9573a', '#6a2a1a', '#4a2a1a'],
  harpy: ['flyer', '#c8a078', '#8a5a3a', '#e8b830'], thunder_roc: ['flyer', '#e8d060', '#5b6ee1', '#fbf236'], storm_giant: ['giant', '#6a8ae0', '#3f3f74', '#2a2a54'],
  rotting_treant: ['treant', '#5a6a3a', '#7a5a3a', '#5a3a2a'], wyvern: ['flyer', '#4f8a52', '#2e5e38', '#c8e070'], elder_wyrm: ['wyrm', '#8e6bb3', '#461980', '#fbf293'],
};
for (const [id, [shape, a, b, c]] of Object.entries(MONSTERS)) {
  put(`monster:${id}`, shade(creature(shape), { A: { ramp: rampFrom(a) }, B: { ramp: rampFrom(b) }, C: { ramp: rampFrom(c) } }, { k: '#140c1c' }), 'generated');
}

// ---------- hand-drawn overrides always win ----------
// Drop art/hand-drawn/overrides/<id>.png (id with ':' written as '-', e.g. helm-5.png) to replace a generated sprite.
if (existsSync(OVERRIDES)) {
  for (const f of readdirSync(OVERRIDES).filter((f) => f.endsWith('.png'))) {
    const id = f.slice(0, -4).replace(/-(?=[^-]+$)/, ':');
    put(id, readPng(OVERRIDES + f).px, 'peter');
  }
}

// ---------- App icons: Peter's Woodcutting icon on the header purple ----------
const APP = fileURLToPath(new URL('../../public/app/', import.meta.url));
mkdirSync(APP, { recursive: true });
function appIcon(size, scale, bg = '#130029') {
  const src = sprites['skill:woodcutting'].px, pad = Math.floor((size - N * scale) / 2);
  const px = Array.from({ length: size }, (_, y) => Array.from({ length: size }, (_, x) => {
    const sx = Math.floor((x - pad) / scale), sy = Math.floor((y - pad) / scale);
    return (sx >= 0 && sy >= 0 && sx < N && sy < N && src[sy][sx]) || bg;
  }));
  return pngBuffer({ width: size, height: size, px });
}
writeFileSync(APP + 'icon-192.png', appIcon(192, 5));
writeFileSync(APP + 'icon-512.png', appIcon(512, 13));
writeFileSync(APP + 'icon-maskable-512.png', appIcon(512, 10));
writeFileSync(fileURLToPath(new URL('../../src/app/icon.png', import.meta.url)), appIcon(64, 2));
writeFileSync(fileURLToPath(new URL('../../src/app/apple-icon.png', import.meta.url)), appIcon(180, 5));

// ---------- outputs ----------
export const fileFor = (id) => id.replace(/:/g, '-') + '.png';
const manifest = {};
for (const [id, s] of Object.entries(sprites)) {
  writeFileSync(OUT + fileFor(id), pngBuffer({ width: N, height: N, px: s.px }));
  manifest[id] = { by: s.by, src: '/icons/' + fileFor(id) };
}
// The app imports this to know every icon and who drew it.
const MANIFEST = fileURLToPath(new URL('../../src/content/sprite-manifest.json', import.meta.url));
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');
const by = Object.values(manifest).reduce((a, s) => ((a[s.by] = (a[s.by] || 0) + 1), a), {});
console.log('sprites', Object.keys(manifest).length, by);
