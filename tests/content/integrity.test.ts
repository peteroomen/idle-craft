import { describe, expect, it } from 'vitest';
import { ACTIVITY_LIST } from '@/content/activities';
import { MAX_LEVEL, XP_TABLE, levelForXp } from '@/content/formulas';
import { ITEMS, ITEM_LIST } from '@/content/items';
import manifest from '@/content/sprite-manifest.json';

const iconSrcs = new Set(Object.values(manifest as Record<string, { src: string }>).map((s) => s.src));

describe('XP curve', () => {
  it('matches the pitch: 2,356,181 xp to 99, half of it lands you at 90', () => {
    expect(XP_TABLE[MAX_LEVEL]).toBe(2_356_181);
    expect(levelForXp(XP_TABLE[MAX_LEVEL] / 2)).toBe(90);
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(XP_TABLE[MAX_LEVEL] * 3)).toBe(MAX_LEVEL);
    for (let l = 2; l <= MAX_LEVEL; l++) expect(XP_TABLE[l]).toBeGreaterThan(XP_TABLE[l - 1]);
  });
});

describe('items', () => {
  it('has the full catalogue', () => {
    expect(ITEM_LIST.length).toBe(154);
  });

  it('every item has an icon, a positive value and a source', () => {
    const made = new Set(ACTIVITY_LIST.flatMap((a) => a.outputs.map((o) => o.item)));
    for (const it of ITEM_LIST) {
      expect(iconSrcs.has(it.icon), `${it.id} icon ${it.icon}`).toBe(true);
      expect(it.value, it.id).toBeGreaterThan(0);
      expect(made.has(it.id), `${it.id} has no source`).toBe(true);
    }
  });

  it('crafted things are worth more than their materials', () => {
    for (const a of ACTIVITY_LIST.filter((x) => x.inputs && x.skill !== 'fletching')) {
      const cost = a.inputs!.reduce((t, i) => t + ITEMS[i.item].value * i.qty, 0);
      const worth = a.outputs.reduce((t, o) => t + ITEMS[o.item].value * o.qty, 0);
      expect(worth, a.id).toBeGreaterThan(cost);
    }
  });
});

describe('activities', () => {
  it('reference real items and icons', () => {
    for (const a of ACTIVITY_LIST) {
      expect(iconSrcs.has(a.icon), a.id).toBe(true);
      for (const x of [...(a.inputs ?? []), ...a.outputs]) expect(ITEMS[x.item], `${a.id} → ${x.item}`).toBeDefined();
      expect(a.xp, a.id).toBeGreaterThan(0);
      expect(a.level, a.id).toBeLessThanOrEqual(MAX_LEVEL);
    }
  });

  it('gathering XP/hour rises with every tier', () => {
    for (const skill of ['woodcutting', 'mining', 'fishing'] as const) {
      const rates = ACTIVITY_LIST.filter((a) => a.skill === skill && a.id !== 'mine_tin').sort((a, b) => a.level - b.level).map((a) => a.xp / a.duration);
      for (let i = 1; i < rates.length; i++) expect(rates[i], `${skill} tier ${i + 1}`).toBeGreaterThan(rates[i - 1]);
    }
  });
});
