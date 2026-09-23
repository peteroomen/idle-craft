import { HITPOINTS_START_LEVEL, HP_PER_LEVEL, XP_TABLE, levelForXp } from '@/content/formulas';
import type { EquipSlot } from '@/content/items';
import { SKILLS } from '@/content/skills';
import type { ItemId, SkillId } from '@/content/types';

export const SAVE_VERSION = 1;

/** Melee: accurate → Attack, aggressive → Strength, defensive → Defense, controlled → all three.
 *  Ranged: accurate/aggressive → Ranged, defensive → Defense, controlled → Ranged + Defense. */
export type Stance = 'accurate' | 'aggressive' | 'defensive' | 'controlled';

export type ActionState =
  | { type: 'activity'; id: string; progress: number }
  | { type: 'combat'; monsterId: string; monsterHp: number; playerTimer: number; monsterTimer: number; respawn: number };

export type GameState = {
  version: number;
  /** Engine clock (ms since epoch) — the moment the state has been advanced to. */
  now: number;
  /** Seeded RNG state. */
  rng: number;
  gold: number;
  xp: Record<SkillId, number>;
  /** Carried items. Equipped items are not in here. */
  inventory: Record<ItemId, number>;
  equipment: Partial<Record<EquipSlot, ItemId>>;
  /** Food auto-eaten in combat. */
  food: ItemId | null;
  hp: number;
  regenTimer: number;
  stance: Stance;
  action: ActionState | null;
  upgrades: { inventory: number; autoEat: number; offline: number };
  stats: { actions: number; kills: number; goldEarned: number; created: number };
};

export function newGame(now: number, seed = (now ^ 0x9e3779b9) | 0): GameState {
  const xp = Object.fromEntries(SKILLS.map((s) => [s.id, 0])) as Record<SkillId, number>;
  xp.hitpoints = XP_TABLE[HITPOINTS_START_LEVEL];
  return {
    version: SAVE_VERSION,
    now,
    rng: seed,
    gold: 50,
    xp,
    // Starter kit: a tool for each gathering skill and something to hit with.
    inventory: { bronze_axe: 1, bronze_pickaxe: 1, pine_rod: 1 },
    equipment: { weapon: 'bronze_sword' },
    food: null,
    hp: HITPOINTS_START_LEVEL * HP_PER_LEVEL,
    regenTimer: 0,
    stance: 'aggressive',
    action: null,
    upgrades: { inventory: 0, autoEat: 0, offline: 0 },
    stats: { actions: 0, kills: 0, goldEarned: 0, created: now },
  };
}

export const level = (s: GameState, skill: SkillId) => levelForXp(s.xp[skill]);
export const maxHp = (s: GameState) => level(s, 'hitpoints') * HP_PER_LEVEL;
export const totalLevel = (s: GameState) => SKILLS.reduce((a, k) => a + level(s, k.id), 0);
