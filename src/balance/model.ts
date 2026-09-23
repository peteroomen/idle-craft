// The balance model: the pitch's spreadsheet maths, computed from the real content and the real
// engine formulas. Used by balance/report.ts (→ balance/report.md) and by the balance tests.
import { ACTIVITY_LIST } from '@/content/activities';
import {
  FLETCH_BOW_MS, FLETCH_XP, FORGE_MS, HP_PER_LEVEL, MAX_LEVEL, REGEN_FRACTION, REGEN_INTERVAL_MS, SMELT_MS, TIERS, TIER_LEVELS,
  XP_TABLE, tierLevel, toolSpeed, type Tier,
} from '@/content/formulas';
import { ITEMS } from '@/content/items';
import { MONSTER_LIST, ZONES, type Monster } from '@/content/monsters';
import { BARS, FISH, METALS, WOODS } from '@/content/tiers';
import type { SkillId } from '@/content/types';
import { fightOdds, newGame, type GameState } from '@/engine';

const HOUR = 3_600_000;
const nextTierLevel = (t: Tier): number => (TIER_LEVELS as readonly number[])[t] ?? MAX_LEVEL;
const bracketXp = (t: Tier) => XP_TABLE[nextTierLevel(t)] - XP_TABLE[tierLevel(t)];

// ---------- Gathering ----------
export type GatherRow = { tier: Tier; name: string; level: number; seconds: number; xp: number; value: number; xpPerHour: number; goldPerHour: number; perHour: number; hours: number };

/** Best node per tier, cut with the same-tier tool. Tin shares tier 1 with copper and is left out. */
export function gathering(skill: 'woodcutting' | 'mining' | 'fishing'): GatherRow[] {
  return ACTIVITY_LIST.filter((a) => a.skill === skill && a.id !== 'mine_tin').map((a) => {
    const item = ITEMS[a.outputs[0].item], tier = item.tier!;
    const ms = a.duration * toolSpeed(tier), perHour = HOUR / ms;
    return { tier, name: a.name, level: a.level, seconds: a.duration / 1000, xp: a.xp, value: item.value, xpPerHour: a.xp * perHour, goldPerHour: item.value * perHour, perHour, hours: bracketXp(tier) / (a.xp * perHour) };
  });
}
export const totalHours = (rows: { hours: number }[]) => rows.reduce((t, r) => t + r.hours, 0);

// ---------- Smithing and Fletching ----------
export type SmithRow = { tier: Tier; name: string; level: number; xpPerBar: number; bars: number; supplyHours: number; anvilHours: number; barValue: number; oreValue: number };
export function smithing(): SmithRow[] {
  const mine = gathering('mining');
  const coal = mine.find((r) => r.name === 'Coal')!;
  return BARS.map((b) => {
    const xpPerBar = b.smeltXp + b.forgeXp, bars = bracketXp(b.tier) / xpPerBar;
    const rate = (item: string) => (item === 'coal' ? coal.perHour * (toolSpeed(3) / toolSpeed(b.tier)) : mine.find((r) => ITEMS[item].tier === r.tier)!.perHour);
    const supplyHours = b.ores.reduce((t, o) => t + (bars * o.qty) / rate(o.item), 0);
    const anvilHours = (bars * SMELT_MS + (bars / 2.5) * FORGE_MS) / HOUR;
    const oreValue = b.ores.reduce((t, o) => t + ITEMS[o.item].value * o.qty, 0);
    return { tier: b.tier, name: METALS[b.tier - 1].name, level: tierLevel(b.tier), xpPerBar, bars, supplyHours, anvilHours, barValue: b.value, oreValue };
  });
}

export type FletchRow = { tier: Tier; name: string; level: number; xpPerLog: number; logs: number; supplyHours: number; benchHours: number };
export function fletching(): FletchRow[] {
  const wc = gathering('woodcutting');
  return WOODS.map((w) => {
    const logs = bracketXp(w.tier) / FLETCH_XP[w.tier - 1];
    return { tier: w.tier, name: w.name, level: tierLevel(w.tier), xpPerLog: FLETCH_XP[w.tier - 1], logs, supplyHours: logs / wc[w.tier - 1].perHour, benchHours: ((logs / 3) * FLETCH_BOW_MS) / HOUR };
  });
}

// ---------- Combat ----------
export type WeaponStyle = 'sword' | 'dagger' | 'greatsword' | 'shortbow' | 'longbow';
export const WEAPON_STYLES: WeaponStyle[] = ['sword', 'dagger', 'greatsword', 'shortbow', 'longbow'];

/** A player arriving at a zone: every combat skill at tier level + 5, full same-tier armour, same-tier food. */
export function typicalPlayer(tier: Tier, style: WeaponStyle): GameState {
  const s = newGame(0, 1);
  const L = Math.min(MAX_LEVEL, tierLevel(tier) + 5);
  for (const k of ['attack', 'strength', 'defense', 'ranged'] as SkillId[]) s.xp[k] = XP_TABLE[L];
  s.xp.hitpoints = XP_TABLE[Math.max(10, L)];
  const m = METALS[tier - 1].id, w = WOODS[tier - 1].id;
  s.equipment = { helm: `${m}_helm`, body: `${m}_platebody`, legs: `${m}_platelegs`, boots: `${m}_boots` };
  if (style === 'shortbow' || style === 'longbow') {
    s.equipment.weapon = `${w}_${style}`;
    s.equipment.ammo = `${m}_arrows`;
    s.inventory[`${m}_arrows`] = 1_000_000;
  } else {
    s.equipment.weapon = `${m}_${style}`;
    if (style !== 'greatsword') s.equipment.shield = `${m}_shield`;
  }
  return s;
}

export type FightRow = { monster: Monster; style: WeaponStyle; yourHit: number; theirHit: number; killSeconds: number; xpPerHour: number; goldPerHour: number; foodPerHour: number; fishingMinutes: number };
export function fight(monster: Monster, style: WeaponStyle): FightRow {
  const s = typicalPlayer(monster.tier, style);
  const o = fightOdds(s, monster.id);
  const hp = Math.max(10, Math.min(MAX_LEVEL, tierLevel(monster.tier) + 5)) * HP_PER_LEVEL;
  const regenPerHour = hp * REGEN_FRACTION * (HOUR / REGEN_INTERVAL_MS);
  const fish = FISH[monster.tier - 1];
  const foodPerHour = Math.max(0, o.damageTakenPerKill * o.killsPerHour - regenPerHour) / fish.heals;
  const fishPerHour = HOUR / (fish.time * 1000 * toolSpeed(monster.tier));
  return { monster, style, yourHit: o.yourHit, theirHit: o.theirHit, killSeconds: o.killSeconds, xpPerHour: o.xpPerHour, goldPerHour: o.killsPerHour * monster.gold, foodPerHour, fishingMinutes: (foodPerHour / fishPerHour) * 60 };
}

/** Hours for one combat skill 1 → 99, fighting each zone's middle monster with a sword. */
export function combatHours(): { tier: Tier; monster: string; xpPerHour: number; hours: number }[] {
  return ZONES.map((z) => {
    const r = fight(z.monsters[1], 'sword');
    return { tier: z.tier, monster: r.monster.name, xpPerHour: r.xpPerHour, hours: bracketXp(z.tier) / r.xpPerHour };
  });
}

// ---------- Rules (CI fails if any break) ----------
export type Rule = { rule: string; pass: boolean; detail: string };
export function rules(): Rule[] {
  const out: Rule[] = [];
  const check = (rule: string, pass: boolean, detail: string) => out.push({ rule, pass, detail });

  for (const skill of ['woodcutting', 'mining', 'fishing'] as const) {
    const rows = gathering(skill);
    const bad = rows.slice(1).filter((r, i) => r.xpPerHour <= rows[i].xpPerHour || r.goldPerHour <= rows[i].goldPerHour);
    check(`${skill}: XP/h and gold/h rise every tier`, bad.length === 0, bad.map((r) => r.name).join(', ') || 'all tiers rise');
    const h = totalHours(rows);
    check(`${skill}: 1 → 99 takes 40–80 h`, h >= 40 && h <= 80, `${h.toFixed(1)} h`);
  }

  const smith = smithing();
  check('smithing: every bar is worth more than its ores', smith.every((r) => r.barValue > r.oreValue), smith.filter((r) => r.barValue <= r.oreValue).map((r) => r.name).join(', ') || 'yes');
  const supply = totalHours(smith.map((r) => ({ hours: r.supplyHours })));
  check('smithing: supplying 1 → 99 needs less mining than Mining 1 → 99', supply < totalHours(gathering('mining')), `${supply.toFixed(1)} h of mining`);

  const outliers: string[] = [];
  for (const m of MONSTER_LIST) {
    const base = fight(m, 'sword').xpPerHour;
    for (const st of WEAPON_STYLES.slice(1)) {
      const r = fight(m, st).xpPerHour / base;
      if (r < 0.88 || r > 1.12) outliers.push(`${st} vs ${m.name} ${(r * 100 - 100).toFixed(0)}%`);
    }
  }
  check('weapons: every type within ±12% of the sword on every monster', outliers.length === 0, outliers.slice(0, 4).join('; ') || 'all within');

  const hungry = MONSTER_LIST.map((m) => fight(m, 'sword')).filter((f) => f.fishingMinutes >= 12);
  check('combat: same-tier fights need < 12 min of fishing per combat hour', hungry.length === 0, hungry.map((f) => `${f.monster.name} ${f.fishingMinutes.toFixed(1)} min`).join(', ') || 'all winnable');

  const orphans = Object.values(ITEMS).filter((it) => !ACTIVITY_LIST.some((a) => a.outputs.some((o) => o.item === it.id)));
  check('items: everything can be made or gathered', orphans.length === 0, orphans.map((i) => i.id).join(', ') || `${Object.keys(ITEMS).length} items`);
  return out;
}

export { TIERS };
