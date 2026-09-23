import type { Emit } from './events';
import type { GameState } from './state';

/** Combat arrives in M4. */
export function stepCombat(s: GameState, _left: number, emit: Emit): number {
  s.action = null;
  emit({ type: 'stop', reason: 'Combat is not ready yet' });
  return 0;
}
