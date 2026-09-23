import { describe, expect, it } from 'vitest';
import { XP_TABLE } from '@/content/formulas';
import { advance, emptySummary, equip, newGame, serialize, setStance, startCombat, summarise, catchUp, type GameState } from '@/engine';

const T0 = 1_700_000_000_000;
const MIN = 60_000;

function fighter(seed = 3): GameState {
  const s = newGame(T0, seed);
  s.inventory.shrimp = 50;
  return s;
}

describe('combat', () => {
  it('a new player beats chickens and trains Strength and Hitpoints', () => {
    const s = fighter();
    expect(startCombat(s, 'chicken')).toBeNull();
    const summary = emptySummary();
    advance(s, 10 * MIN, summarise(summary));
    expect(summary.kills.chicken).toBeGreaterThan(20);
    expect(s.xp.strength).toBeGreaterThan(0);
    expect(s.xp.attack).toBe(0);
    expect(s.xp.hitpoints).toBeGreaterThan(XP_TABLE[10]);
    expect(s.gold).toBeGreaterThan(50);
    expect(s.action?.type).toBe('combat');
  });

  it('is deterministic for a given seed', () => {
    const a = fighter(9), b = fighter(9);
    startCombat(a, 'giant_rat'); startCombat(b, 'giant_rat');
    advance(a, 30 * MIN, () => {});
    for (let i = 0; i < 1800; i++) advance(b, 1000, () => {});
    expect(serialize(a)).toBe(serialize(b));
  });

  it('stance picks the skill', () => {
    const s = fighter();
    setStance(s, 'accurate');
    startCombat(s, 'chicken');
    advance(s, 5 * MIN, () => {});
    expect(s.xp.attack).toBeGreaterThan(0);
    expect(s.xp.strength).toBe(0);
    setStance(s, 'controlled');
    const before = { ...s.xp };
    advance(s, 5 * MIN, () => {});
    expect(s.xp.attack).toBeGreaterThan(before.attack);
    expect(s.xp.strength).toBeGreaterThan(before.strength);
    expect(s.xp.defense).toBeGreaterThan(before.defense);
  });

  it('bows use up arrows and stop when they run out', () => {
    const s = fighter();
    s.inventory.pine_shortbow = 1; s.inventory.bronze_arrows = 30;
    equip(s, 'pine_shortbow'); equip(s, 'bronze_arrows');
    expect(startCombat(s, 'chicken')).toBeNull();
    const summary = emptySummary();
    advance(s, 10 * MIN, summarise(summary));
    expect(s.inventory.bronze_arrows).toBeUndefined();
    expect(summary.stop).toBe('Out of arrows');
    expect(s.xp.ranged).toBeGreaterThan(0);
  });

  it('refuses a bow fight without arrows', () => {
    const s = fighter();
    s.inventory.pine_shortbow = 1;
    equip(s, 'pine_shortbow');
    expect(startCombat(s, 'chicken')).toBe('Equip some arrows first');
  });

  it('eats automatically and retreats when beaten', () => {
    const s = fighter();
    s.inventory.shrimp = 5;
    startCombat(s, 'elder_wyrm');
    const summary = emptySummary();
    advance(s, 10 * MIN, summarise(summary));
    expect(summary.eaten.shrimp).toBe(5);
    expect(summary.defeats).toBe(1);
    expect(s.action).toBeNull();
    expect(s.hp).toBeGreaterThan(0);
  });

  it('twelve hours of offline combat is quick to simulate', () => {
    const s = fighter();
    s.inventory.shrimp = 5000;
    startCombat(s, 'goblin');
    const t = performance.now();
    catchUp(s, T0 + 12 * 60 * MIN, 12 * 60 * MIN, () => {});
    expect(performance.now() - t).toBeLessThan(2000);
    expect(s.stats.kills).toBeGreaterThan(100);
  });
});
