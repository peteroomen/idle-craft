import { describe, expect, it } from 'vitest';
import { LISTINGS, nextUpgrade } from '@/content/shop';
import { ITEMS } from '@/content/items';
import { buy, capacity, newGame } from '@/engine';

const T0 = 1_700_000_000_000;

describe('shop', () => {
  it('never sells anything for less than it buys back', () => {
    for (const l of LISTINGS) if (l.kind === 'item') expect(l.price, l.id).toBeGreaterThan(ITEMS[l.item].value);
  });

  it('only stocks tiers 1-5', () => {
    for (const l of LISTINGS) if (l.kind === 'item') expect(ITEMS[l.item].tier ?? 1, l.id).toBeLessThanOrEqual(5);
  });

  it('buys items with gold', () => {
    const s = newGame(T0);
    s.gold = 300;
    expect(buy(s, 'buy_iron_axe')).toBeNull();
    expect(s.inventory.iron_axe).toBe(1);
    expect(s.gold).toBe(50);
    expect(buy(s, 'buy_iron_axe')).toBe('Not enough gold');
    expect(buy(s, 'buy_bronze_arrows', 40)).toBeNull();
    expect(s.inventory.bronze_arrows).toBe(40);
    expect(s.gold).toBe(10);
  });

  it('upgrades inventory, auto-eat and offline time until maxed', () => {
    const s = newGame(T0);
    s.gold = 10_000_000;
    const before = capacity(s);
    expect(buy(s, 'upgrade_inventory')).toBeNull();
    expect(capacity(s)).toBe(before + 8);
    expect(buy(s, 'upgrade_autoEat')).toBeNull();
    expect(buy(s, 'upgrade_autoEat')).toBeNull();
    expect(buy(s, 'upgrade_autoEat')).toBe('Already maxed');
    expect(nextUpgrade('offline', 0)?.price).toBe(75_000);
    expect(buy(s, 'upgrade_offline')).toBeNull();
    expect(s.upgrades.offline).toBe(1);
  });
});
