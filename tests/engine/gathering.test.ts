import { describe, expect, it } from 'vitest';
import { advance, catchUp, deserialize, exportSave, importSave, level, newGame, sell, serialize, startActivity, summarise, emptySummary, actionDuration, ignore, type GameEvent } from '@/engine';
import { activity } from '@/content/activities';
import { XP_TABLE } from '@/content/formulas';
import { ITEM_LIST } from '@/content/items';

const T0 = 1_700_000_000_000;
const HOUR = 3_600_000;

describe('gathering', () => {
  it('cuts one pine log every 3 s with the starter axe', () => {
    const s = newGame(T0, 1);
    expect(startActivity(s, 'cut_pine')).toBeNull();
    advance(s, 2999, ignore);
    expect(s.inventory.pine_log).toBeUndefined();
    advance(s, 1, ignore);
    expect(s.inventory.pine_log).toBe(1);
    expect(s.xp.woodcutting).toBe(10);
  });

  it('runs an hour in one call and in many small calls to the same result', () => {
    const a = newGame(T0, 7), b = newGame(T0, 7);
    startActivity(a, 'cut_pine'); startActivity(b, 'cut_pine');
    advance(a, HOUR, ignore);
    for (let i = 0; i < 36_000; i++) advance(b, 100, ignore);
    expect(serialize(a)).toBe(serialize(b));
    expect(a.now).toBe(T0 + HOUR);
  });

  it('gates trees by level', () => {
    const s = newGame(T0);
    expect(startActivity(s, 'cut_oak')).toBe('Needs level 10');
    s.xp.woodcutting = XP_TABLE[10];
    expect(startActivity(s, 'cut_oak')).toBeNull();
  });

  it('uses the best tool you own and can use', () => {
    const s = newGame(T0);
    const oak = activity('cut_oak');
    s.xp.woodcutting = XP_TABLE[10];
    expect(actionDuration(s, oak)).toBe(3500);
    s.inventory.iron_axe = 1;
    expect(actionDuration(s, oak)).toBe(3325);
    s.inventory.steel_axe = 1; // needs level 20: ignored
    expect(actionDuration(s, oak)).toBe(3325);
    delete s.inventory.bronze_axe; delete s.inventory.iron_axe; delete s.inventory.steel_axe;
    expect(actionDuration(s, oak)).toBe(Math.round(3500 * 1.15));
  });

  it('emits level-ups', () => {
    const s = newGame(T0);
    const events: GameEvent[] = [];
    startActivity(s, 'cut_pine');
    advance(s, 10 * 60_000, (e) => events.push(e));
    const levels = events.filter((e) => e.type === 'level').map((e) => (e as { level: number }).level);
    expect(levels[0]).toBe(2);
    expect(levels.at(-1)).toBe(level(s, 'woodcutting'));
  });
});

describe('crafting', () => {
  it('smelts bronze until the ore runs out, then stops with a reason', () => {
    const s = newGame(T0);
    s.inventory.copper_ore = 3; s.inventory.tin_ore = 5;
    const summary = emptySummary();
    expect(startActivity(s, 'smelt_bronze')).toBeNull();
    advance(s, 60_000, summarise(summary));
    expect(s.inventory.bronze_bar).toBe(3);
    expect(s.inventory.copper_ore).toBeUndefined();
    expect(s.inventory.tin_ore).toBe(2);
    expect(s.action).toBeNull();
    expect(summary.stop).toBe('Out of copper ore');
  });

  it('refuses to start without inputs', () => {
    const s = newGame(T0);
    expect(startActivity(s, 'smelt_bronze')).toBe('Out of copper ore');
  });
});

describe('inventory', () => {
  it('stops when a new item type has no free slot', () => {
    const s = newGame(T0);
    s.inventory = {};
    for (const it of ITEM_LIST) if (it.id !== 'pine_log' && Object.keys(s.inventory).length < 48) s.inventory[it.id] = 1;
    expect(startActivity(s, 'cut_pine')).toBe('Inventory full');
    delete s.inventory.oak_log;
    expect(startActivity(s, 'cut_pine')).toBeNull();
    s.inventory.oak_log = 1;
    advance(s, 3000, ignore); // pine_log now takes the 49th slot? No: it couldn't be added.
    expect(s.inventory.pine_log).toBeUndefined();
    expect(s.action).toBeNull();
  });

  it('sells for the item value', () => {
    const s = newGame(T0);
    s.inventory.oak_log = 10;
    expect(sell(s, 'oak_log', 4)).toBeNull();
    expect(s.gold).toBe(50 + 12);
    expect(s.inventory.oak_log).toBe(6);
    expect(sell(s, 'oak_log', 99)).toBeNull();
    expect(s.inventory.oak_log).toBeUndefined();
  });
});

describe('offline', () => {
  it('simulates up to the cap and skips the rest', () => {
    const s = newGame(T0);
    startActivity(s, 'cut_pine');
    const r = catchUp(s, T0 + 20 * HOUR, 12 * HOUR, ignore);
    expect(r.simulated).toBe(12 * HOUR);
    expect(s.now).toBe(T0 + 20 * HOUR);
    expect(s.inventory.pine_log).toBeGreaterThan(0);
  });
});

describe('save', () => {
  it('round-trips and repairs unknown data', () => {
    const s = newGame(T0);
    s.inventory.pine_log = 5;
    const back = deserialize(serialize(s))!;
    expect(serialize(back)).toBe(serialize(s));
    const dirty = JSON.parse(serialize(s));
    dirty.inventory.not_a_thing = 3;
    dirty.xp.cooking = 10;
    const fixed = deserialize(JSON.stringify(dirty))!;
    expect(fixed.inventory.not_a_thing).toBeUndefined();
    expect((fixed.xp as Record<string, number>).cooking).toBeUndefined();
    expect(importSave(exportSave(s))).toEqual(s);
    expect(deserialize('nope')).toBeNull();
  });
});
