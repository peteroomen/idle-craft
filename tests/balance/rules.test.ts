import { describe, expect, it } from 'vitest';
import { combatHours, gathering, rules, totalHours } from '@/balance/model';

describe('balance rules', () => {
  for (const r of rules()) {
    it(r.rule, () => {
      expect(r.pass, r.detail).toBe(true);
    });
  }

  it('matches the pitch: ~58 h per gathering skill, ~56 h per combat skill', () => {
    expect(totalHours(gathering('woodcutting'))).toBeCloseTo(57.7, 0);
    expect(totalHours(combatHours())).toBeGreaterThan(45);
    expect(totalHours(combatHours())).toBeLessThan(70);
  });
});
