import { AMMO_PER_CRAFT, ARMOUR_SET, ARMOUR_SHARE, CRAFT_VALUE_MULT, TIERS, WEAPON_BONUS, tierLevel, toolSpeed, type Tier } from './formulas';
import { BARS, FISH, FLETCH_ITEMS, FORGE_ITEMS, METALS, ROCKS, WOODS, type ForgeType } from './tiers';
import type { ItemId, SkillId, ToolKind } from './types';

export type EquipSlot = 'weapon' | 'shield' | 'helm' | 'body' | 'legs' | 'boots' | 'ammo';
export const EQUIP_SLOTS: EquipSlot[] = ['weapon', 'shield', 'helm', 'body', 'legs', 'boots', 'ammo'];

export type EquipStats = {
  /** % added to the attack rating. */
  accuracy?: number;
  /** % added to max hit (melee). */
  strength?: number;
  /** % added to max hit (ranged, from arrows). */
  rangedStrength?: number;
  /** % added to the defense rating. */
  armour?: number;
  /** ms between attacks. */
  speed?: number;
  /** max-hit multiplier; slow weapons hit harder. */
  damage?: number;
  twoHanded?: boolean;
  style?: 'melee' | 'ranged';
};

export type ItemCategory = 'log' | 'ore' | 'bar' | 'fish' | 'weapon' | 'armour' | 'tool' | 'ammo' | 'material';

export type Item = {
  id: ItemId;
  name: string;
  icon: string;
  category: ItemCategory;
  tier?: Tier;
  /** Sell price in gold. Ammo and parts may be fractional; sales round down. */
  value: number;
  heals?: number;
  tool?: { kind: ToolKind; skill: SkillId; level: number; speed: number };
  equip?: { slot: EquipSlot; skill: SkillId; level: number; stats: EquipStats };
};

const icon = (sprite: string) => `/icons/${sprite}.png`;
const items: Item[] = [];
const add = (item: Item) => items.push(item);

// Gathered
for (const w of WOODS) add({ id: `${w.id}_log`, name: `${w.name} logs`, icon: icon(`log-${w.tier}`), category: 'log', tier: w.tier, value: w.value });
for (const r of ROCKS) add({ id: r.item, name: r.id === 'coal' ? 'Coal' : `${r.name} ore`, icon: icon(r.icon), category: 'ore', tier: r.tier, value: r.value });
for (const f of FISH) add({ id: f.id, name: f.name, icon: icon(`fish-${f.tier}`), category: 'fish', tier: f.tier, value: f.value, heals: f.heals });

// Smithed
const TOOL_OF: Partial<Record<ForgeType, { kind: ToolKind; skill: SkillId }>> = { axe: { kind: 'axe', skill: 'woodcutting' }, pickaxe: { kind: 'pickaxe', skill: 'mining' } };
const ARMOUR_OF: Partial<Record<ForgeType, { slot: EquipSlot; share: number }>> = {
  helm: { slot: 'helm', share: ARMOUR_SHARE.helm }, platebody: { slot: 'body', share: ARMOUR_SHARE.body }, platelegs: { slot: 'legs', share: ARMOUR_SHARE.legs },
  shield: { slot: 'shield', share: ARMOUR_SHARE.shield }, boots: { slot: 'boots', share: ARMOUR_SHARE.boots },
};
export const MELEE_WEAPONS: Record<'dagger' | 'sword' | 'greatsword', { acc: number; damage: number; speed: number; twoHanded: boolean }> = {
  dagger: { acc: 1.3, damage: 0.72, speed: 1800, twoHanded: false },
  sword: { acc: 1.0, damage: 1.0, speed: 2400, twoHanded: false },
  greatsword: { acc: 0.85, damage: 1.62, speed: 3400, twoHanded: true },
};
export const BOWS: Record<'shortbow' | 'longbow', { acc: number; damage: number; speed: number }> = {
  shortbow: { acc: 0.9, damage: 0.92, speed: 2200 },
  longbow: { acc: 1.4, damage: 1.2, speed: 3000 },
};

for (const bar of BARS) {
  const m = METALS[bar.tier - 1], t = bar.tier, L = tierLevel(t), W = WEAPON_BONUS[t - 1];
  add({ id: `${m.id}_bar`, name: `${m.name} bar`, icon: icon(`bar-${t}`), category: 'bar', tier: t, value: bar.value });
  for (const f of FORGE_ITEMS) {
    const base: Item = { id: `${m.id}_${f.type}`, name: `${m.name} ${f.name.toLowerCase()}`, icon: icon(`${f.type}-${t}`), category: 'weapon', tier: t, value: Math.round(f.bars * bar.value * CRAFT_VALUE_MULT) };
    const tool = TOOL_OF[f.type];
    const armour = ARMOUR_OF[f.type];
    if (f.type === 'dagger' || f.type === 'sword' || f.type === 'greatsword') {
      const w = MELEE_WEAPONS[f.type];
      add({ ...base, equip: { slot: 'weapon', skill: 'attack', level: L, stats: { accuracy: Math.round(W * w.acc), strength: W, speed: w.speed, damage: w.damage, twoHanded: w.twoHanded, style: 'melee' } } });
    } else if (tool) {
      add({ ...base, category: 'tool', tool: { kind: tool.kind, skill: tool.skill, level: L, speed: toolSpeed(t) } });
    } else if (armour) {
      add({ ...base, name: `${m.name} ${f.name.toLowerCase()}`, category: 'armour', equip: { slot: armour.slot, skill: 'defense', level: L, stats: { armour: Math.round(ARMOUR_SET[t - 1] * armour.share) } } });
    } else if (f.type === 'arrowtips') {
      add({ ...base, name: `${m.name} arrowtips`, category: 'material', value: (bar.value * 1.2) / AMMO_PER_CRAFT });
    }
  }
}

// Fletched
const SHAFT_VALUE = 0.05;
add({ id: 'arrow_shafts', name: 'Arrow shafts', icon: icon('shafts'), category: 'material', value: SHAFT_VALUE });
for (const t of TIERS) {
  const m = METALS[t - 1];
  const tips = items.find((i) => i.id === `${m.id}_arrowtips`)!;
  add({ id: `${m.id}_arrows`, name: `${m.name} arrows`, icon: icon(`arrows-${t}`), category: 'ammo', tier: t, value: (tips.value + SHAFT_VALUE) * CRAFT_VALUE_MULT, equip: { slot: 'ammo', skill: 'ranged', level: tierLevel(t), stats: { rangedStrength: WEAPON_BONUS[t - 1] } } });
}
for (const w of WOODS) {
  const t = w.tier, L = tierLevel(t), W = WEAPON_BONUS[t - 1];
  for (const f of FLETCH_ITEMS) {
    const base: Item = { id: `${w.id}_${f.type}`, name: `${w.name} ${f.name.toLowerCase()}`, icon: icon(`${f.type}-${t}`), category: 'weapon', tier: t, value: Math.round(f.logs * w.value * CRAFT_VALUE_MULT) };
    if (f.type === 'rod') add({ ...base, category: 'tool', tool: { kind: 'rod', skill: 'fishing', level: L, speed: toolSpeed(t) } });
    else {
      const b = BOWS[f.type];
      add({ ...base, equip: { slot: 'weapon', skill: 'ranged', level: L, stats: { accuracy: Math.round(W * b.acc), speed: b.speed, damage: b.damage, twoHanded: true, style: 'ranged' } } });
    }
  }
}

export const ITEMS: Record<ItemId, Item> = Object.fromEntries(items.map((i) => [i.id, i]));
export const ITEM_LIST: Item[] = items;
export const item = (id: ItemId): Item => {
  const it = ITEMS[id];
  if (!it) throw new Error(`Unknown item: ${id}`);
  return it;
};
