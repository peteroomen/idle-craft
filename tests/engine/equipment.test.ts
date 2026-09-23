import { describe, expect, it } from 'vitest';
import { XP_TABLE } from '@/content/formulas';
import { combatStats, equip, newGame, unequip } from '@/engine';

const T0 = 1_700_000_000_000;

describe('equipment', () => {
  it('needs the level to wield or wear', () => {
    const s = newGame(T0);
    s.inventory.iron_sword = 1; s.inventory.iron_helm = 1;
    expect(equip(s, 'iron_sword')).toBe('Needs Attack 10');
    expect(equip(s, 'iron_helm')).toBe('Needs Defense 10');
    s.xp.attack = XP_TABLE[10];
    expect(equip(s, 'iron_sword')).toBeNull();
    expect(s.equipment.weapon).toBe('iron_sword');
    expect(s.inventory.bronze_sword).toBe(1); // the starter sword came back
    expect(s.inventory.iron_sword).toBeUndefined();
  });

  it('two-handers and shields push each other out', () => {
    const s = newGame(T0);
    s.inventory.bronze_shield = 1; s.inventory.bronze_greatsword = 1;
    expect(equip(s, 'bronze_shield')).toBeNull();
    expect(equip(s, 'bronze_greatsword')).toBeNull();
    expect(s.equipment.shield).toBeUndefined();
    expect(s.inventory.bronze_shield).toBe(1);
    expect(equip(s, 'bronze_shield')).toBeNull();
    expect(s.equipment.weapon).toBeUndefined();
    expect(s.inventory.bronze_greatsword).toBe(1);
  });

  it('ammo points at a stack that stays in the inventory', () => {
    const s = newGame(T0);
    s.inventory.bronze_arrows = 120; s.inventory.pine_shortbow = 1;
    expect(equip(s, 'pine_shortbow')).toBeNull();
    expect(equip(s, 'bronze_arrows')).toBeNull();
    expect(s.inventory.bronze_arrows).toBe(120);
    const st = combatStats(s);
    expect(st.style).toBe('ranged');
    expect(st.ammoCount).toBe(120);
    expect(st.strength).toBe(10);
    expect(unequip(s, 'ammo')).toBeNull();
    expect(combatStats(s).strength).toBe(0);
  });

  it('works out ratings the way the pitch does', () => {
    const s = newGame(T0); // Attack 1, Strength 1, bronze sword (+10%)
    const st = combatStats(s);
    expect(st.attackRating).toBeCloseTo(11 * 1.1);
    expect(st.maxHit).toBe(Math.round(2 * 11 * 1.1));
    expect(st.defenseRating).toBe(11);
    expect(st.maxHp).toBe(100);
  });
});
