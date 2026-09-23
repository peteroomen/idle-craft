import { activity as activityDef } from '@/content/activities';
import { ITEMS } from '@/content/items';
import type { ItemId } from '@/content/types';
import { cannotStart } from './activity';
import { ignore, type Emit } from './events';
import { count, take } from './inventory';
import type { GameState } from './state';

// Player commands. Each returns an error message, or null on success, and mutates the state.

export function startActivity(s: GameState, id: string): string | null {
  const a = activityDef(id);
  const why = cannotStart(s, a);
  if (why) return why;
  s.action = { type: 'activity', id, progress: 0 };
  return null;
}

export function stop(s: GameState): string | null {
  s.action = null;
  return null;
}

/** Sell up to `qty` of an item. Fractional values (ammo) round down on the total. */
export function sell(s: GameState, item: ItemId, qty: number, emit: Emit = ignore): string | null {
  const n = Math.min(Math.floor(qty), count(s, item));
  if (n <= 0) return 'Nothing to sell';
  const gold = Math.floor(ITEMS[item].value * n);
  take(s, item, n, emit);
  s.gold += gold;
  s.stats.goldEarned += gold;
  emit({ type: 'gold', amount: gold });
  return null;
}
