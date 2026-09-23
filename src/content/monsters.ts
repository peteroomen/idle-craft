import { monsterStats, TIERS, type Archetype, type Tier } from './formulas';
import { FISH, METALS, ROCKS, WOODS } from './tiers';
import type { ItemId } from './types';

export type Drop = { item: ItemId; min: number; max: number; chance: number };
export type Monster = {
  id: string; name: string; zone: string; tier: Tier; level: number; archetype: Archetype; icon: string;
  hp: number; attack: number; defense: number; maxHit: number; speed: number; gold: number; drops: Drop[];
};
export type Zone = { id: string; name: string; tier: Tier; blurb: string; monsters: Monster[] };

const ZONE_DEFS: [string, string, [string, number, Archetype, string][]][] = [
  ['Farmstead Fields', 'Fences, hens and the odd goblin raid.', [['Chicken', 1, 'weak', 'bronze_dagger'], ['Giant Rat', 4, 'swift', 'bronze_boots'], ['Goblin', 8, 'balanced', 'bronze_sword']]],
  ['Old Oak Road', 'A merchant track through the oak woods.', [['Wolf', 12, 'swift', 'iron_boots'], ['Bandit', 15, 'balanced', 'iron_sword'], ['Giant Spider', 19, 'brute', 'iron_helm']]],
  ['Sunken Barrow', 'Burial mounds that did not stay closed.', [['Skeleton', 22, 'balanced', 'steel_dagger'], ['Ghoul', 26, 'brute', 'steel_helm'], ['Barrow Knight', 31, 'tank', 'steel_shield']]],
  ['Saltmarsh', 'Reeds, mud and things that live in both.', [['Mudcrab', 34, 'tank', 'verdite_boots'], ['Bog Troll', 40, 'brute', 'verdite_greatsword'], ['Sea Hag', 45, 'swift', 'verdite_helm']]],
  ['Frostpeak Pass', 'A mountain road that eats travellers.', [['Frost Wolf', 48, 'swift', 'mithril_boots'], ['Yeti', 54, 'brute', 'mithril_platelegs'], ['Ice Wraith', 60, 'balanced', 'mithril_sword']]],
  ['Ember Deeps', 'Mine shafts that went too far down.', [['Magma Crawler', 63, 'tank', 'orichalcum_shield'], ['Salamander', 68, 'swift', 'orichalcum_dagger'], ['Fire Giant', 74, 'brute', 'orichalcum_greatsword']]],
  ['Stormspire', 'A peak that is always under a storm.', [['Harpy', 78, 'swift', 'nightsteel_boots'], ['Thunder Roc', 83, 'balanced', 'nightsteel_helm'], ['Storm Giant', 88, 'brute', 'nightsteel_platebody']]],
  ['Elder Grove', 'The oldest wood, and what guards it.', [['Rotting Treant', 91, 'tank', 'magic_longbow'], ['Wyvern', 95, 'balanced', 'meteorite_sword'], ['Elder Wyrm', 99, 'boss', 'meteorite_platebody']]],
];

/** Each zone drops its tier's materials; each monster has one signature piece of gear. */
function dropsFor(tier: Tier, gear: ItemId, arch: Archetype): Drop[] {
  const boss = arch === 'boss' ? 4 : 1;
  const ore = tier === 1 ? ROCKS[0].item : ROCKS.find((r) => r.tier === tier && r.id !== 'tin')!.item;
  return [
    { item: `${WOODS[tier - 1].id}_log`, min: 1, max: 3, chance: 0.12 },
    { item: ore, min: 1, max: 3, chance: 0.12 * boss },
    { item: FISH[tier - 1].id, min: 1, max: 2, chance: 0.08 },
    { item: `${METALS[tier - 1].id}_bar`, min: 1, max: 1 + (boss > 1 ? 2 : 0), chance: 0.04 * boss },
    { item: gear, min: 1, max: 1, chance: 0.01 * boss * 1.25 },
  ];
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '_');

export const ZONES: Zone[] = ZONE_DEFS.map(([name, blurb, list], i) => {
  const tier = TIERS[i];
  return {
    id: slug(name), name, tier, blurb,
    monsters: list.map(([mName, level, archetype, gear]) => ({
      id: slug(mName), name: mName, zone: slug(name), tier, level, archetype, icon: `/icons/monster-${slug(mName)}.png`,
      ...monsterStats(level, archetype), drops: dropsFor(tier, gear, archetype),
    })),
  };
});

export const MONSTERS: Record<string, Monster> = Object.fromEntries(ZONES.flatMap((z) => z.monsters).map((m) => [m.id, m]));
export const MONSTER_LIST = Object.values(MONSTERS);
