import type { Tier } from './formulas';

// The eight tiers. Woods and the six original metals are Peter's; Verdite and Nightsteel are new.

export type Metal = { tier: Tier; id: string; name: string; color: string };
export const METALS: Metal[] = [
  { tier: 1, id: 'bronze', name: 'Bronze', color: '#f2b272' },
  { tier: 2, id: 'iron', name: 'Iron', color: '#a0a0a0' },
  { tier: 3, id: 'steel', name: 'Steel', color: '#b8cdd9' },
  { tier: 4, id: 'verdite', name: 'Verdite', color: '#7fd07a' },
  { tier: 5, id: 'mithril', name: 'Mithril', color: '#8c96e5' },
  { tier: 6, id: 'orichalcum', name: 'Orichalcum', color: '#cb8ae6' },
  { tier: 7, id: 'nightsteel', name: 'Nightsteel', color: '#5fcde4' },
  { tier: 8, id: 'meteorite', name: 'Meteorite', color: '#fbf293' },
];

/** time = seconds per log with no tool bonus; value = sell price per log. */
export type Wood = { tier: Tier; id: string; name: string; time: number; value: number };
export const WOODS: Wood[] = [
  { tier: 1, id: 'pine', name: 'Pine', time: 3.0, value: 1 },
  { tier: 2, id: 'oak', name: 'Oak', time: 3.5, value: 3 },
  { tier: 3, id: 'birch', name: 'Birch', time: 4.0, value: 6 },
  { tier: 4, id: 'teak', name: 'Teak', time: 5.0, value: 12 },
  { tier: 5, id: 'maple', name: 'Maple', time: 6.0, value: 24 },
  { tier: 6, id: 'mahogany', name: 'Mahogany', time: 7.0, value: 45 },
  { tier: 7, id: 'yew', name: 'Yew', time: 8.5, value: 80 },
  { tier: 8, id: 'magic', name: 'Magic', time: 10.0, value: 140 },
];

/** icon = sprite id of the ore. Coal sits at tier 3 so steel needs Mining 20. */
export type Rock = { tier: Tier; id: string; name: string; item: string; time: number; value: number; icon: string };
export const ROCKS: Rock[] = [
  { tier: 1, id: 'copper', name: 'Copper', item: 'copper_ore', time: 3.0, value: 1, icon: 'ore-1' },
  { tier: 1, id: 'tin', name: 'Tin', item: 'tin_ore', time: 3.0, value: 1, icon: 'ore-tin' },
  { tier: 2, id: 'iron', name: 'Iron', item: 'iron_ore', time: 3.5, value: 4, icon: 'ore-2' },
  { tier: 3, id: 'coal', name: 'Coal', item: 'coal', time: 4.0, value: 5, icon: 'ore-3' },
  { tier: 4, id: 'verdite', name: 'Verdite', item: 'verdite_ore', time: 5.0, value: 14, icon: 'ore-4' },
  { tier: 5, id: 'mithril', name: 'Mithril', item: 'mithril_ore', time: 6.0, value: 28, icon: 'ore-5' },
  { tier: 6, id: 'orichalcum', name: 'Orichalcum', item: 'orichalcum_ore', time: 7.0, value: 55, icon: 'ore-6' },
  { tier: 7, id: 'nightsteel', name: 'Nightsteel', item: 'nightsteel_ore', time: 8.5, value: 95, icon: 'ore-7' },
  { tier: 8, id: 'meteorite', name: 'Meteorite', item: 'meteorite_ore', time: 10.0, value: 170, icon: 'ore-8' },
];

export type Fish = { tier: Tier; id: string; name: string; time: number; value: number; heals: number };
export const FISH: Fish[] = [
  { tier: 1, id: 'shrimp', name: 'Shrimp', time: 4.0, value: 2, heals: 30 },
  { tier: 2, id: 'perch', name: 'Perch', time: 4.5, value: 4, heals: 50 },
  { tier: 3, id: 'trout', name: 'Trout', time: 5.0, value: 8, heals: 80 },
  { tier: 4, id: 'salmon', name: 'Salmon', time: 6.0, value: 15, heals: 120 },
  { tier: 5, id: 'tuna', name: 'Tuna', time: 7.0, value: 28, heals: 170 },
  { tier: 6, id: 'marlin', name: 'Marlin', time: 8.0, value: 50, heals: 240 },
  { tier: 7, id: 'stormray', name: 'Stormray', time: 9.5, value: 85, heals: 330 },
  { tier: 8, id: 'leviathan_eel', name: 'Leviathan Eel', time: 11.0, value: 150, heals: 450 },
];

/** Smelting: ore(s) + coal → bar. forgeXp is paid per bar used when forging. */
export type Bar = { tier: Tier; metal: string; ores: { item: string; qty: number }[]; smeltXp: number; forgeXp: number; value: number };
export const BARS: Bar[] = [
  { tier: 1, metal: 'bronze', ores: [{ item: 'copper_ore', qty: 1 }, { item: 'tin_ore', qty: 1 }], smeltXp: 6, forgeXp: 12, value: 5 },
  { tier: 2, metal: 'iron', ores: [{ item: 'iron_ore', qty: 1 }], smeltXp: 10, forgeXp: 20, value: 10 },
  { tier: 3, metal: 'steel', ores: [{ item: 'iron_ore', qty: 1 }, { item: 'coal', qty: 1 }], smeltXp: 15, forgeXp: 30, value: 20 },
  { tier: 4, metal: 'verdite', ores: [{ item: 'verdite_ore', qty: 1 }, { item: 'coal', qty: 1 }], smeltXp: 22, forgeXp: 44, value: 40 },
  { tier: 5, metal: 'mithril', ores: [{ item: 'mithril_ore', qty: 1 }, { item: 'coal', qty: 2 }], smeltXp: 32, forgeXp: 62, value: 80 },
  { tier: 6, metal: 'orichalcum', ores: [{ item: 'orichalcum_ore', qty: 1 }, { item: 'coal', qty: 2 }], smeltXp: 44, forgeXp: 86, value: 150 },
  { tier: 7, metal: 'nightsteel', ores: [{ item: 'nightsteel_ore', qty: 1 }, { item: 'coal', qty: 3 }], smeltXp: 60, forgeXp: 118, value: 260 },
  { tier: 8, metal: 'meteorite', ores: [{ item: 'meteorite_ore', qty: 1 }, { item: 'coal', qty: 3 }], smeltXp: 80, forgeXp: 160, value: 450 },
];

/** What the forge makes from bars: bars used and the Smithing level offset above the tier level. */
export const FORGE_ITEMS = [
  { type: 'dagger', name: 'Dagger', bars: 1, offset: 0 },
  { type: 'axe', name: 'Axe', bars: 1, offset: 1 },
  { type: 'arrowtips', name: 'Arrowtips', bars: 1, offset: 2 },
  { type: 'helm', name: 'Helm', bars: 2, offset: 2 },
  { type: 'pickaxe', name: 'Pickaxe', bars: 2, offset: 3 },
  { type: 'sword', name: 'Sword', bars: 2, offset: 4 },
  { type: 'boots', name: 'Boots', bars: 2, offset: 5 },
  { type: 'shield', name: 'Shield', bars: 3, offset: 6 },
  { type: 'platelegs', name: 'Platelegs', bars: 3, offset: 7 },
  { type: 'greatsword', name: 'Greatsword', bars: 3, offset: 8 },
  { type: 'platebody', name: 'Platebody', bars: 5, offset: 9 },
] as const;
export type ForgeType = (typeof FORGE_ITEMS)[number]['type'];

/** What the fletching bench makes from logs. */
export const FLETCH_ITEMS = [
  { type: 'rod', name: 'Fishing rod', logs: 2, offset: 1 },
  { type: 'shortbow', name: 'Shortbow', logs: 3, offset: 3 },
  { type: 'longbow', name: 'Longbow', logs: 5, offset: 6 },
] as const;
export type FletchType = (typeof FLETCH_ITEMS)[number]['type'];

export const metalByTier = (t: Tier) => METALS[t - 1];
export const woodByTier = (t: Tier) => WOODS[t - 1];
