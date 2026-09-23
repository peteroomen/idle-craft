import { activity as activityDef } from '@/content/activities';
import { ITEMS } from '@/content/items';
import { LISTING_BY_ID, nextUpgrade } from '@/content/shop';
import type { ItemId } from '@/content/types';
import { cannotStart } from './activity';
import { ignore, type Emit } from './events';
import { count, give, hasRoomFor, take } from './inventory';
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

/** Buy `qty` of a shop listing (upgrades are always one at a time). */
export function buy(s: GameState, listingId: string, qty = 1, emit: Emit = ignore): string | null {
  const l = LISTING_BY_ID[listingId];
  if (!l) return 'Not for sale';
  if (l.kind === 'upgrade') {
    const next = nextUpgrade(l.upgrade, s.upgrades[l.upgrade]);
    if (!next) return 'Already maxed';
    if (s.gold < next.price) return 'Not enough gold';
    s.gold -= next.price;
    s.upgrades[l.upgrade] += 1;
    return null;
  }
  const n = Math.floor(qty);
  if (n <= 0) return 'Pick a quantity';
  const cost = l.price * n;
  if (s.gold < cost) return 'Not enough gold';
  if (!hasRoomFor(s, l.item)) return 'Inventory full';
  s.gold -= cost;
  give(s, l.item, n, emit);
  return null;
}
