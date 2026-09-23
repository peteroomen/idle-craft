import { AMMO_PER_CRAFT, FLETCH_BOW_MS, FLETCH_MS, FLETCH_XP, FORGE_MS, SMELT_MS, TIERS, gatherXp, tierLevel } from './formulas';
import { ITEMS } from './items';
import { BARS, FISH, FLETCH_ITEMS, FORGE_ITEMS, METALS, ROCKS, WOODS } from './tiers';
import type { Activity, SkillId } from './types';

const list: Activity[] = [];

// ---------- Gathering: one item per action, sped up by the best tool you own ----------
for (const w of WOODS) {
  list.push({
    id: `cut_${w.id}`, skill: 'woodcutting', action: 'Cut', name: w.name, icon: ITEMS[`${w.id}_log`].icon,
    duration: w.time * 1000, xp: gatherXp(w.tier, w.time), level: tierLevel(w.tier),
    outputs: [{ item: `${w.id}_log`, qty: 1 }], toolKind: 'axe',
  });
}
for (const r of ROCKS) {
  list.push({
    id: `mine_${r.id}`, skill: 'mining', action: 'Mine', name: r.name, icon: ITEMS[r.item].icon,
    duration: r.time * 1000, xp: gatherXp(r.tier, r.time), level: tierLevel(r.tier),
    outputs: [{ item: r.item, qty: 1 }], toolKind: 'pickaxe',
  });
}
for (const f of FISH) {
  list.push({
    id: `fish_${f.id}`, skill: 'fishing', action: 'Catch', name: f.name, icon: ITEMS[f.id].icon,
    duration: f.time * 1000, xp: gatherXp(f.tier, f.time), level: tierLevel(f.tier),
    outputs: [{ item: f.id, qty: 1 }], toolKind: 'rod',
  });
}

// ---------- Smithing ----------
for (const bar of BARS) {
  const m = METALS[bar.tier - 1], L = tierLevel(bar.tier);
  list.push({
    id: `smelt_${m.id}`, skill: 'smithing', action: 'Smelt', name: `${m.name} bar`, icon: ITEMS[`${m.id}_bar`].icon, category: 'Smelting',
    duration: SMELT_MS, xp: bar.smeltXp, level: L, inputs: bar.ores, outputs: [{ item: `${m.id}_bar`, qty: 1 }],
  });
  for (const f of FORGE_ITEMS) {
    const out = `${m.id}_${f.type}`;
    list.push({
      id: `forge_${out}`, skill: 'smithing', action: 'Forge', name: f.type === 'arrowtips' ? `${m.name} arrowtips` : ITEMS[out].name, icon: ITEMS[out].icon, category: m.name,
      duration: FORGE_MS, xp: f.bars * bar.forgeXp, level: L + f.offset, inputs: [{ item: `${m.id}_bar`, qty: f.bars }],
      outputs: [{ item: out, qty: f.type === 'arrowtips' ? AMMO_PER_CRAFT : 1 }],
    });
  }
}

// ---------- Fletching ----------
for (const w of WOODS) {
  const L = tierLevel(w.tier), xp = FLETCH_XP[w.tier - 1];
  list.push({
    id: `shafts_${w.id}`, skill: 'fletching', action: 'Fletch', name: `Arrow shafts (${w.name})`, icon: ITEMS.arrow_shafts.icon, category: 'Arrows',
    duration: FLETCH_MS, xp: Math.round(xp * 0.5), level: L, inputs: [{ item: `${w.id}_log`, qty: 1 }], outputs: [{ item: 'arrow_shafts', qty: AMMO_PER_CRAFT }],
  });
  for (const f of FLETCH_ITEMS) {
    const out = `${w.id}_${f.type}`;
    list.push({
      id: `fletch_${out}`, skill: 'fletching', action: 'Fletch', name: ITEMS[out].name, icon: ITEMS[out].icon, category: f.type === 'rod' ? 'Rods' : 'Bows',
      duration: f.type === 'rod' ? FLETCH_MS : FLETCH_BOW_MS, xp: f.logs * xp, level: L + f.offset,
      inputs: [{ item: `${w.id}_log`, qty: f.logs }], outputs: [{ item: out, qty: 1 }],
    });
  }
}
for (const t of TIERS) {
  const m = METALS[t - 1];
  list.push({
    id: `fletch_${m.id}_arrows`, skill: 'fletching', action: 'Fletch', name: `${m.name} arrows`, icon: ITEMS[`${m.id}_arrows`].icon, category: 'Arrows',
    duration: FLETCH_MS, xp: Math.round(FLETCH_XP[t - 1] * 1.5), level: tierLevel(t) + 1,
    inputs: [{ item: 'arrow_shafts', qty: AMMO_PER_CRAFT }, { item: `${m.id}_arrowtips`, qty: AMMO_PER_CRAFT }],
    outputs: [{ item: `${m.id}_arrows`, qty: AMMO_PER_CRAFT }],
  });
}

export const ACTIVITIES: Record<string, Activity> = Object.fromEntries(list.map((a) => [a.id, a]));
export const ACTIVITY_LIST = list;
export const activitiesFor = (skill: SkillId) => list.filter((a) => a.skill === skill).sort((a, b) => a.level - b.level);
export const activity = (id: string): Activity => {
  const a = ACTIVITIES[id];
  if (!a) throw new Error(`Unknown activity: ${id}`);
  return a;
};
