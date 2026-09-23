import { REGEN_FRACTION, REGEN_INTERVAL_MS } from '@/content/formulas';
import { stepActivity } from './activity';
import { stepCombat } from './combat';
import type { Emit } from './events';
import { maxHp, type GameState } from './state';

/**
 * The whole game: move the state forward by `ms`. The live clock calls this every 100 ms;
 * coming back after eight hours calls it once with eight hours. Mutates `s`.
 */
export function advance(s: GameState, ms: number, emit: Emit) {
  let left = Math.max(0, Math.floor(ms));
  let guard = 0;
  while (left > 0) {
    const before = s.action;
    // Never step past a regen tick, so healing happens at the same moment however time is chunked.
    const budget = Math.min(left, REGEN_INTERVAL_MS - s.regenTimer);
    let used: number;
    if (!before) used = budget;
    else if (before.type === 'activity') used = stepActivity(s, budget, emit);
    else used = stepCombat(s, budget, emit);
    if (used > 0) {
      regen(s, used);
      s.now += used;
      left -= used;
      guard = 0;
    } else if (s.action === before && ++guard > 3) {
      // A step that makes no progress and doesn't stop would spin forever.
      s.action = null;
    }
  }
}

/** A steady clock: every 10 s of game time heals 1% of max HP. */
export function regen(s: GameState, ms: number) {
  s.regenTimer += ms;
  while (s.regenTimer >= REGEN_INTERVAL_MS) {
    s.regenTimer -= REGEN_INTERVAL_MS;
    const max = maxHp(s);
    s.hp = Math.min(max, s.hp + Math.max(1, Math.round(max * REGEN_FRACTION)));
  }
}

/**
 * Catch up after the game wasn't running. Time beyond the offline cap is skipped, not simulated.
 * Returns how much time was simulated.
 */
export function catchUp(s: GameState, now: number, capMs: number, emit: Emit): { elapsed: number; simulated: number } {
  const elapsed = Math.max(0, now - s.now);
  const simulated = Math.min(elapsed, capMs);
  advance(s, simulated, emit);
  s.now = now;
  return { elapsed, simulated };
}
