import { INVENTORY_BASE_SLOTS, INVENTORY_SLOTS_PER_UPGRADE } from '@/content/formulas';
import type { ItemId } from '@/content/types';
import type { Emit } from './events';
import type { GameState } from './state';

export const capacity = (s: GameState) => INVENTORY_BASE_SLOTS + s.upgrades.inventory * INVENTORY_SLOTS_PER_UPGRADE;
export const slotsUsed = (s: GameState) => Object.keys(s.inventory).length;
export const count = (s: GameState, item: ItemId) => s.inventory[item] ?? 0;
/** A new item type needs a free slot; stacks never do. */
export const hasRoomFor = (s: GameState, item: ItemId) => item in s.inventory || slotsUsed(s) < capacity(s);

export function give(s: GameState, item: ItemId, qty: number, emit: Emit): boolean {
  if (qty <= 0) return true;
  if (!hasRoomFor(s, item)) return false;
  s.inventory[item] = (s.inventory[item] ?? 0) + qty;
  emit({ type: 'gain', item, qty });
  return true;
}

export function take(s: GameState, item: ItemId, qty: number, emit: Emit): boolean {
  const have = count(s, item);
  if (qty <= 0) return true;
  if (have < qty) return false;
  if (have === qty) delete s.inventory[item];
  else s.inventory[item] = have - qty;
  emit({ type: 'spend', item, qty });
  return true;
}
