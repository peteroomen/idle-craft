import { UNARMED, maxHit as maxHitFor, rating } from '@/content/formulas';
import { EQUIP_SLOTS, ITEMS, type EquipSlot, type EquipStats } from '@/content/items';
import { SKILL_BY_ID } from '@/content/skills';
import type { ItemId } from '@/content/types';
import { ignore, type Emit } from './events';
import { capacity, count, give, slotsUsed, take } from './inventory';
import { level, maxHp, type GameState } from './state';

/** Why this item can't be equipped, or null. */
export function cannotEquip(s: GameState, id: ItemId): string | null {
  const it = ITEMS[id];
  if (!it?.equip) return "That can't be equipped";
  if (count(s, id) < 1) return "You don't have one";
  if (level(s, it.equip.skill) < it.equip.level) return `Needs ${SKILL_BY_ID[it.equip.skill].name} ${it.equip.level}`;
  return null;
}

const isTwoHanded = (id?: ItemId) => !!(id && ITEMS[id]?.equip?.stats.twoHanded);

/**
 * Equip an item. Weapons and armour move out of the inventory; the ammo slot just points at a
 * stack of arrows, which ranged attacks use up from the inventory.
 */
export function equip(s: GameState, id: ItemId, emit: Emit = ignore): string | null {
  const why = cannotEquip(s, id);
  if (why) return why;
  const slot = ITEMS[id].equip!.slot;
  if (slot === 'ammo') { s.equipment.ammo = id; return null; }

  const displaced: EquipSlot[] = [slot];
  if (slot === 'weapon' && isTwoHanded(id)) displaced.push('shield');
  if (slot === 'shield' && isTwoHanded(s.equipment.weapon)) displaced.push('weapon');
  const returning = displaced.map((d) => s.equipment[d]).filter((x): x is ItemId => !!x);
  const freed = count(s, id) === 1 ? 1 : 0;
  const newTypes = new Set(returning.filter((r) => !(r in s.inventory) && r !== id)).size;
  if (slotsUsed(s) - freed + newTypes > capacity(s)) return 'Inventory full';

  take(s, id, 1, emit);
  for (const d of displaced) {
    const old = s.equipment[d];
    if (old) { give(s, old, 1, emit); delete s.equipment[d]; }
  }
  s.equipment[slot] = id;
  return null;
}

export function unequip(s: GameState, slot: EquipSlot, emit: Emit = ignore): string | null {
  const id = s.equipment[slot];
  if (!id) return 'Nothing equipped';
  if (slot !== 'ammo') {
    if (!give(s, id, 1, emit)) return 'Inventory full';
  }
  delete s.equipment[slot];
  return null;
}

export type CombatStats = {
  style: 'melee' | 'ranged';
  speed: number;
  accuracy: number;
  strength: number;
  armour: number;
  attackRating: number;
  maxHit: number;
  defenseRating: number;
  maxHp: number;
  ammo: ItemId | null;
  ammoCount: number;
};

const sum = (s: GameState, key: keyof EquipStats, slots: EquipSlot[] = EQUIP_SLOTS) =>
  slots.reduce((t, slot) => {
    const id = s.equipment[slot];
    const v = id ? ITEMS[id]?.equip?.stats[key] : undefined;
    return t + (typeof v === 'number' ? v : 0);
  }, 0);

/** Everything combat needs to know about the player's current gear and levels. */
export function combatStats(s: GameState): CombatStats {
  const weapon = s.equipment.weapon ? ITEMS[s.equipment.weapon]?.equip?.stats : undefined;
  const style = weapon?.style ?? 'melee';
  const ammo = style === 'ranged' ? s.equipment.ammo ?? null : null;
  const ammoCount = ammo ? count(s, ammo) : 0;
  const accuracy = sum(s, 'accuracy');
  const strength = style === 'ranged' ? (ammo ? ITEMS[ammo].equip?.stats.rangedStrength ?? 0 : 0) : sum(s, 'strength');
  const armour = sum(s, 'armour');
  const attackLevel = style === 'ranged' ? level(s, 'ranged') : level(s, 'attack');
  const strengthLevel = style === 'ranged' ? level(s, 'ranged') : level(s, 'strength');
  return {
    style,
    speed: weapon?.speed ?? UNARMED.speed,
    accuracy,
    strength,
    armour,
    attackRating: rating(attackLevel, accuracy),
    maxHit: maxHitFor(strengthLevel, strength, weapon?.damage ?? UNARMED.damage),
    defenseRating: rating(level(s, 'defense'), armour),
    maxHp: maxHp(s),
    ammo,
    ammoCount,
  };
}
