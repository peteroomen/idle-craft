// Every balance number in Ironbark lives here. `npm run balance` turns these into
// balance/report.md, so any change shows its effect in the pull request.

// ---------- Levels ----------
export const MAX_LEVEL = 99;
export const XP_BASE = 100; // xp to go from level 1 to 2
export const XP_GROWTH = 1.08; // each level costs 8% more than the last

export const xpToNext = (level: number) => Math.round(XP_BASE * XP_GROWTH ** (level - 1));

/** XP_TABLE[level] = total xp needed to reach that level (index 0 unused). */
export const XP_TABLE: number[] = (() => {
  const t = [0, 0];
  for (let level = 2; level <= MAX_LEVEL; level++) t[level] = t[level - 1] + xpToNext(level - 1);
  return t;
})();

export function levelForXp(xp: number): number {
  let lo = 1, hi = MAX_LEVEL;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (XP_TABLE[mid] <= xp) lo = mid; else hi = mid - 1;
  }
  return lo;
}

// ---------- Tiers ----------
export const TIER_LEVELS = [1, 10, 20, 30, 45, 60, 75, 90] as const;
export type Tier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export const TIERS: Tier[] = [1, 2, 3, 4, 5, 6, 7, 8];
export const tierLevel = (tier: Tier) => TIER_LEVELS[tier - 1];

// ---------- Gathering ----------
/** Each tool tier takes 5% off action time. */
export const TOOL_SPEED_STEP = 0.05;
export const toolSpeed = (tier: Tier) => 1 - TOOL_SPEED_STEP * (tier - 1);
/** Design input: xp/hour for the tier-t resource with a tier-t tool (12k → 48k). */
export const gatherXpPerHour = (tier: Tier) => 12000 * 4 ** ((tier - 1) / 7);
/** XP per action is derived from the target rate, so every gathering skill keeps the same pace. */
export const gatherXp = (tier: Tier, seconds: number) => Math.round((gatherXpPerHour(tier) * seconds * toolSpeed(tier)) / 3600);

// ---------- Artisan ----------
export const SMELT_MS = 2000;
export const FORGE_MS = 3000;
export const FLETCH_MS = 1500;
export const FLETCH_BOW_MS = 2500;
/** Fletching xp per log carved, by wood tier. */
export const FLETCH_XP = [8, 12, 18, 26, 36, 50, 68, 90] as const;
export const AMMO_PER_CRAFT = 50;

// ---------- Inventory, offline, food ----------
export const INVENTORY_BASE_SLOTS = 48;
export const INVENTORY_SLOTS_PER_UPGRADE = 8;
export const inventoryUpgradeCost = (bought: number) => Math.round(1000 * 1.4 ** bought);
export const OFFLINE_CAP_HOURS = [12, 18, 24] as const;
export const OFFLINE_UPGRADE_COST = [75_000, 500_000] as const;
/** Gaps longer than this are summarised in the "While you were away" dialog. */
export const AWAY_THRESHOLD_MS = 60_000;
export const AUTO_EAT = [
  { threshold: 0.3, toFull: false },
  { threshold: 0.5, toFull: false },
  { threshold: 0.5, toFull: true },
] as const;
export const AUTO_EAT_COST = [40_000, 400_000] as const;

// ---------- Hitpoints ----------
export const HP_PER_LEVEL = 10;
export const HITPOINTS_START_LEVEL = 10;
export const REGEN_INTERVAL_MS = 10_000;
export const REGEN_FRACTION = 0.01;

// ---------- Combat ----------
/** Weapon accuracy/strength bonus (%) and full armour set (%) by tier. */
export const WEAPON_BONUS = [10, 18, 28, 40, 55, 72, 92, 115] as const;
export const ARMOUR_SET = [12, 24, 40, 60, 85, 115, 150, 190] as const;
export const ARMOUR_SHARE = { helm: 0.15, body: 0.3, legs: 0.22, shield: 0.2, boots: 0.13 } as const;
export const XP_PER_DAMAGE = 0.35;
export const HITPOINTS_XP_SHARE = 1 / 3;
export const RESPAWN_MS = 2000;
export const UNARMED = { speed: 2400, damage: 0.8 } as const;

export const rating = (level: number, bonusPct: number) => (level + 10) * (1 + bonusPct / 100);
export const maxHit = (level: number, bonusPct: number, damageMult = 1) => Math.max(1, Math.round(2 * (level + 10) * (1 + bonusPct / 100) * damageMult));
export const hitChance = (attack: number, defense: number) => Math.min(0.95, Math.max(0.05, attack / (attack + defense)));

export type Archetype = 'weak' | 'swift' | 'balanced' | 'brute' | 'tank' | 'boss';
export const ARCHETYPES: Record<Archetype, { hp: number; att: number; str: number; def: number; speed: number }> = {
  weak: { hp: 0.8, att: 0.8, str: 0.8, def: 0.8, speed: 3000 },
  swift: { hp: 0.85, att: 1.1, str: 0.75, def: 0.9, speed: 2200 },
  balanced: { hp: 1.0, att: 1.0, str: 1.0, def: 1.0, speed: 2800 },
  brute: { hp: 1.15, att: 0.9, str: 1.35, def: 0.85, speed: 3400 },
  tank: { hp: 1.4, att: 0.9, str: 0.9, def: 1.3, speed: 3000 },
  boss: { hp: 2.5, att: 1.15, str: 1.2, def: 1.15, speed: 3000 },
};
export function monsterStats(level: number, arch: Archetype) {
  const a = ARCHETYPES[arch];
  return {
    hp: Math.round(((20 + 4 * level ** 1.2) * a.hp) / 5) * 5,
    attack: rating(level * a.att, 1.1 * level),
    defense: rating(level * a.def, 1.2 * level),
    maxHit: Math.round(0.55 * (level * a.str + 10) * (1 + (1.1 * level) / 100)),
    speed: a.speed,
    gold: Math.round((2 + 0.8 * level ** 1.4) * a.hp),
  };
}

// ---------- Economy ----------
/** Shop price per bar (or log) an item takes to craft, tiers 1-5. */
export const SHOP_PRICE_PER_MATERIAL = [15, 60, 250, 900, 3500] as const;
export const SHOP_TOOL_PRICE = [20, 250, 1200, 5000, 20000] as const;
export const SHOP_MAX_TIER = 5;
/** Crafted items sell for this much more than their materials. */
export const CRAFT_VALUE_MULT = 1.3;
