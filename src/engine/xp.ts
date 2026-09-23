import { levelForXp, MAX_LEVEL, XP_TABLE } from '@/content/formulas';
import type { SkillId } from '@/content/types';
import type { Emit } from './events';
import type { GameState } from './state';

const XP_CAP = XP_TABLE[MAX_LEVEL] * 5;

export function addXp(s: GameState, skill: SkillId, amount: number, emit: Emit) {
  if (amount <= 0) return;
  const before = levelForXp(s.xp[skill]);
  s.xp[skill] = Math.min(XP_CAP, s.xp[skill] + amount);
  emit({ type: 'xp', skill, amount });
  const after = levelForXp(s.xp[skill]);
  for (let l = before + 1; l <= after; l++) emit({ type: 'level', skill, level: l });
}
