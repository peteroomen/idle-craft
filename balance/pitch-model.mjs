// Ironbark balance model — the first pass that produced the pitch page's numbers.
// Kept for reference; balance/report.ts computes the same tables from the real game content.
// Run: node model.mjs            (prints tables)
//      node model.mjs --json     (dumps data for the pitch page)

// ---------- XP curve ----------
const MAX_LEVEL = 99;
const XP_BASE = 100;   // xp to go 1 -> 2
const XP_GROWTH = 1.08; // each level costs 8% more than the last
const xpToNext = (L) => Math.round(XP_BASE * XP_GROWTH ** (L - 1));
const XP_TABLE = [0, 0]; // XP_TABLE[L] = total xp needed to reach level L
for (let L = 2; L <= MAX_LEVEL; L++) XP_TABLE[L] = XP_TABLE[L - 1] + xpToNext(L - 1);
const xpBetween = (a, b) => XP_TABLE[b] - XP_TABLE[a];

// ---------- Tiers ----------
const TIER_LEVELS = [1, 10, 20, 30, 45, 60, 75, 90];
const TOOL_SPEED = [1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65]; // action-time multiplier of tier-t tool
// Design input: target xp/hour for the tier-t resource with a tier-t tool.
const GATHER_XPH = TIER_LEVELS.map((_, t) => 12000 * 4 ** (t / 7)); // 12k -> 48k

const TREES = [
  ['Pine', 3.0, 1], ['Oak', 3.5, 3], ['Birch', 4.0, 6], ['Teak', 5.0, 12],
  ['Maple', 6.0, 24], ['Mahogany', 7.0, 45], ['Yew', 8.5, 80], ['Magic', 10.0, 140],
];
const ROCKS = [
  ['Copper', 3.0, 1], ['Iron', 3.5, 4], ['Coal', 4.0, 5], ['Verdite', 5.0, 14],
  ['Mithril', 6.0, 28], ['Orichalcum', 7.0, 55], ['Nightsteel', 8.5, 95], ['Meteorite', 10.0, 170],
];
const FISH = [
  ['Shrimp', 4.0, 2, 30], ['Perch', 4.5, 4, 50], ['Trout', 5.0, 8, 80], ['Salmon', 6.0, 15, 120],
  ['Tuna', 7.0, 28, 170], ['Marlin', 8.0, 50, 240], ['Stormray', 9.5, 85, 330], ['Leviathan Eel', 11.0, 150, 450],
];

function gatherTable(nodes) {
  return nodes.map(([name, time, sell, heal], t) => {
    const xp = Math.round((GATHER_XPH[t] * time * TOOL_SPEED[t]) / 3600);
    const eff = time * TOOL_SPEED[t];
    const perHour = 3600 / eff;
    const next = TIER_LEVELS[t + 1] ?? MAX_LEVEL;
    const hours = xpBetween(TIER_LEVELS[t], next) / (xp * perHour);
    return { tier: t + 1, name, level: TIER_LEVELS[t], time, xp, sell, heal, xph: xp * perHour, gph: sell * perHour, perHour, hours };
  });
}

// ---------- Smithing ----------
const METALS = [
  // name, ore(s), coal, smelt xp/bar, forge xp/bar, bar sell
  ['Bronze', 'Copper + Tin', 0, 6, 12, 5],
  ['Iron', 'Iron', 0, 10, 20, 10],
  ['Steel', 'Iron', 1, 15, 30, 20],
  ['Verdite', 'Verdite', 1, 22, 44, 40],
  ['Mithril', 'Mithril', 2, 32, 62, 80],
  ['Orichalcum', 'Orichalcum', 2, 44, 86, 150],
  ['Nightsteel', 'Nightsteel', 3, 60, 118, 260],
  ['Meteorite', 'Meteorite', 3, 80, 160, 450],
];
const SMELT_TIME = 2, FORGE_TIME = 3;

function smithingModel(gather) {
  const mine = gather.mining;
  const oreRate = (t) => mine[t].perHour; // ore/h with on-tier pick
  const coalRate = (t) => 3600 / (ROCKS[2][1] * TOOL_SPEED[t]); // coal/h using your best pick
  return METALS.map(([name, ore, coal, sx, fx, sell], t) => {
    const next = TIER_LEVELS[t + 1] ?? MAX_LEVEL;
    const xpNeeded = xpBetween(TIER_LEVELS[t], next);
    const xpPerBar = sx + fx; // smelt it, then forge it
    const bars = xpNeeded / xpPerBar;
    const oreHours = bars * (t === 0 ? 2 : 1) / oreRate(t) + (bars * coal) / coalRate(t);
    const smithHours = (bars * SMELT_TIME + (bars / 2.5) * FORGE_TIME) / 3600; // avg 2.5 bars/item
    const oreSell = t === 0 ? 2 : mine[t].sell + coal * ROCKS[2][2];
    return { tier: t + 1, name, ore, coal, level: TIER_LEVELS[t], smeltXp: sx, forgeXp: fx, barSell: sell, oreSell, bars, oreHours, smithHours };
  });
}

// ---------- Fletching ----------
const FLETCH_XP = [8, 12, 18, 26, 36, 50, 68, 90]; // xp per log carved, by wood tier
function fletchingModel(gather) {
  const wc = gather.woodcutting;
  return TIER_LEVELS.map((L, t) => {
    const next = TIER_LEVELS[t + 1] ?? MAX_LEVEL;
    const logs = xpBetween(L, next) / FLETCH_XP[t];
    return { tier: t + 1, name: wc[t].name, level: L, xpPerLog: FLETCH_XP[t], logs, supplyHours: logs / wc[t].perHour, benchHours: (logs * 1.2) / 3600 };
  });
}

// ---------- Combat ----------
const WEAPON_BONUS = [10, 18, 28, 40, 55, 72, 92, 115];   // sword acc/str %, by tier
const ARMOUR_SET = [12, 24, 40, 60, 85, 115, 150, 190];  // full set incl. shield, %
const SHIELD_SHARE = 0.2;
const XP_PER_DMG = 0.35, HP_XP_PER_DMG = 0.35 / 3;
const RESPAWN = 2; // seconds between kills
// acc = multiplier on the tier's accuracy bonus; dmg = multiplier on max hit (slow weapons hit harder)
const WEAPONS = {
  dagger: { speed: 1.8, acc: 1.3, dmg: 0.72, twoHanded: false },
  sword: { speed: 2.4, acc: 1.0, dmg: 1.0, twoHanded: false },
  greatsword: { speed: 3.4, acc: 0.85, dmg: 1.62, twoHanded: true },
  shortbow: { speed: 2.2, acc: 0.9, dmg: 0.92, twoHanded: true, ranged: true },
  longbow: { speed: 3.0, acc: 1.4, dmg: 1.2, twoHanded: true, ranged: true },
};
const rating = (lvl, bonus) => (lvl + 10) * (1 + bonus / 100);
const maxHit = (lvl, bonus) => Math.round(2 * (lvl + 10) * (1 + bonus / 100));
const hitChance = (a, d) => Math.min(0.95, Math.max(0.05, a / (a + d)));

const ZONES = [
  ['Farmstead Fields', [['Chicken', 1, 'weak'], ['Giant Rat', 4, 'swift'], ['Goblin', 8, 'balanced']]],
  ['Old Oak Road', [['Wolf', 12, 'swift'], ['Bandit', 15, 'balanced'], ['Giant Spider', 19, 'brute']]],
  ['Sunken Barrow', [['Skeleton', 22, 'balanced'], ['Ghoul', 26, 'brute'], ['Barrow Knight', 31, 'tank']]],
  ['Saltmarsh', [['Mudcrab', 34, 'tank'], ['Bog Troll', 40, 'brute'], ['Sea Hag', 45, 'swift']]],
  ['Frostpeak Pass', [['Frost Wolf', 48, 'swift'], ['Yeti', 54, 'brute'], ['Ice Wraith', 60, 'balanced']]],
  ['Ember Deeps', [['Magma Crawler', 63, 'tank'], ['Salamander', 68, 'swift'], ['Fire Giant', 74, 'brute']]],
  ['Stormspire', [['Harpy', 78, 'swift'], ['Thunder Roc', 83, 'balanced'], ['Storm Giant', 88, 'brute']]],
  ['Elder Grove', [['Rotting Treant', 91, 'tank'], ['Wyvern', 95, 'balanced'], ['Elder Wyrm', 99, 'boss']]],
];
const ARCH = {
  weak: { hp: 0.8, att: 0.8, str: 0.8, def: 0.8, speed: 3.0 },
  swift: { hp: 0.85, att: 1.1, str: 0.75, def: 0.9, speed: 2.2 },
  balanced: { hp: 1.0, att: 1.0, str: 1.0, def: 1.0, speed: 2.8 },
  brute: { hp: 1.15, att: 0.9, str: 1.35, def: 0.85, speed: 3.4 },
  tank: { hp: 1.4, att: 0.9, str: 0.9, def: 1.3, speed: 3.0 },
  boss: { hp: 2.5, att: 1.15, str: 1.2, def: 1.15, speed: 3.0 },
};
function monster(name, m, arch) {
  const a = ARCH[arch];
  return {
    name, level: m, arch,
    hp: Math.round((20 + 4 * m ** 1.2) * a.hp / 5) * 5,
    att: rating(m * a.att, 1.1 * m), def: rating(m * a.def, 1.2 * m),
    maxHit: Math.round(0.55 * (m * a.str + 10) * (1 + (1.1 * m) / 100)),
    speed: a.speed,
    gold: Math.round((2 + 0.8 * m ** 1.4) * a.hp),
  };
}
// A "typical" player arriving at tier t: skills at tier level + 5, on-tier gear, on-tier food.
function fight(t, mon, style = 'sword') {
  const w = WEAPONS[style];
  const lvl = Math.min(99, TIER_LEVELS[t] + 5);
  const hpLvl = Math.max(10, lvl);
  const bonus = WEAPON_BONUS[t];
  const aRating = rating(lvl, bonus * w.acc);
  const mh = Math.round(maxHit(lvl, bonus) * w.dmg);
  const armour = ARMOUR_SET[t] * (w.twoHanded ? 1 - SHIELD_SHARE : 1);
  const dRating = rating(lvl, armour);
  const pHit = hitChance(aRating, mon.def);
  const dps = (pHit * (mh + 1) / 2) / w.speed;
  const ttk = mon.hp / dps;
  const cycle = ttk + RESPAWN;
  const killsPerHour = 3600 / cycle;
  const mHit = hitChance(mon.att, dRating);
  const takenPerHour = (mHit * (mon.maxHit + 1) / 2 / mon.speed) * ttk * killsPerHour;
  const regenPerHour = hpLvl * 10 * 0.01 * 360; // 1% max HP / 10s
  const food = FISH[t];
  const foodPerHour = Math.max(0, takenPerHour - regenPerHour) / food[3];
  const dmgPerHour = mon.hp * killsPerHour;
  const fishPerHourAtTier = 3600 / (food[1] * TOOL_SPEED[t]);
  return {
    tier: t + 1, style, playerLvl: lvl, monster: mon.name, mLevel: mon.level, mHp: mon.hp, mMaxHit: mon.maxHit,
    pHit, mHit, playerMax: mh, ttk, killsPerHour, xph: dmgPerHour * XP_PER_DMG, hpXph: dmgPerHour * HP_XP_PER_DMG,
    gph: mon.gold * killsPerHour, foodPerHour, fishingMinutesPerCombatHour: (foodPerHour / fishPerHourAtTier) * 60,
    arrowsPerHour: w.ranged ? (3600 / w.speed) * (ttk / cycle) : 0,
  };
}

// ---------- Run ----------
const gather = { woodcutting: gatherTable(TREES), mining: gatherTable(ROCKS), fishing: gatherTable(FISH) };
const smith = smithingModel(gather);
const fletch = fletchingModel(gather);
const monsters = ZONES.flatMap(([zone, ms], t) => ms.map(([n, m, a]) => ({ zone, zoneTier: t + 1, ...monster(n, m, a) })));
const fights = monsters.map((mon) => ['sword', 'greatsword', 'dagger', 'longbow', 'shortbow'].map((s) => fight(mon.zoneTier - 1, mon, s)));

const fmt = (n, d = 0) => Number(n).toLocaleString('en-NZ', { maximumFractionDigits: d, minimumFractionDigits: d });
if (process.argv.includes('--json')) {
  const curve = [];
  for (let L = 1; L <= MAX_LEVEL; L++) curve.push({ L, total: XP_TABLE[L], toNext: L < MAX_LEVEL ? xpToNext(L) : 0 });
  console.log(JSON.stringify({ curve, gather, smith, fletch, monsters, fights, TIER_LEVELS, TOOL_SPEED, WEAPON_BONUS, ARMOUR_SET }));
} else {
  console.log(`XP to 99: ${fmt(XP_TABLE[99])} · halfway at level ${XP_TABLE.findIndex((x) => x >= XP_TABLE[99] / 2)}`);
  for (const L of [2, 10, 20, 30, 45, 60, 75, 90, 99]) console.log(`  L${L}: ${fmt(XP_TABLE[L])}`);
  for (const [skill, rows] of Object.entries(gather)) {
    console.log(`\n${skill}`);
    let tot = 0;
    for (const r of rows) {
      tot += r.hours;
      console.log(`  T${r.tier} ${r.name.padEnd(13)} L${String(r.level).padStart(2)} ${r.time}s ${String(r.xp).padStart(3)}xp  ${fmt(r.xph)} xp/h  ${fmt(r.gph)} g/h  bracket ${fmt(r.hours, 1)}h  cum ${fmt(tot, 1)}h`);
    }
  }
  console.log('\nsmithing (bars to clear each bracket, gathering hours to supply them, forge hours)');
  let o = 0, s = 0;
  for (const r of smith) {
    o += r.oreHours; s += r.smithHours;
    console.log(`  ${r.name.padEnd(12)} L${r.level} xp/bar ${r.smeltXp + r.forgeXp} bars ${fmt(r.bars)} gather ${fmt(r.oreHours, 1)}h smith ${fmt(r.smithHours, 1)}h  bar ${r.barSell}g vs ore ${r.oreSell}g`);
  }
  console.log(`  total gather ${fmt(o, 1)}h, total at anvil ${fmt(s, 1)}h`);
  console.log('\ncombat (typical player at zone tier)');
  for (const f of fights) {
    const [sw, gs, dg, lb, sb] = f;
    console.log(`  T${sw.tier} ${sw.monster.padEnd(14)} m${String(sw.mLevel).padStart(2)} hp${String(sw.mHp).padStart(5)} max${String(sw.mMaxHit).padStart(4)} | sword hit ${fmt(sw.pHit * 100)}% ttk ${fmt(sw.ttk, 1)}s ${fmt(sw.xph)}xp/h ${fmt(sw.gph)}g/h food ${fmt(sw.foodPerHour, 1)}/h (${fmt(sw.fishingMinutesPerCombatHour, 1)} fish-min) | GS ${fmt(gs.xph)} DG ${fmt(dg.xph)} LB ${fmt(lb.xph)} SB ${fmt(sb.xph)} arrows ${fmt(lb.arrowsPerHour)}/h`);
  }
}
