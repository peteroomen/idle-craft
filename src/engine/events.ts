import type { ItemId, SkillId } from '@/content/types';

export type GameEvent =
  | { type: 'gain'; item: ItemId; qty: number }
  | { type: 'spend'; item: ItemId; qty: number }
  | { type: 'xp'; skill: SkillId; amount: number }
  | { type: 'level'; skill: SkillId; level: number }
  | { type: 'gold'; amount: number }
  | { type: 'stop'; reason: string }
  | { type: 'kill'; monster: string }
  | { type: 'defeat'; monster: string }
  | { type: 'eat'; item: ItemId; heal: number };

export type Emit = (e: GameEvent) => void;
export const ignore: Emit = () => {};

/** Everything that happened over a stretch of time: the "While you were away" dialog. */
export type Summary = {
  ms: number;
  gained: Record<ItemId, number>;
  spent: Record<ItemId, number>;
  xp: Partial<Record<SkillId, number>>;
  levels: Partial<Record<SkillId, { from: number; to: number }>>;
  gold: number;
  kills: Record<string, number>;
  defeats: number;
  eaten: Record<ItemId, number>;
  stop?: string;
};

export const emptySummary = (): Summary => ({ ms: 0, gained: {}, spent: {}, xp: {}, levels: {}, gold: 0, kills: {}, defeats: 0, eaten: {} });

export function summarise(summary: Summary): Emit {
  return (e) => {
    switch (e.type) {
      case 'gain': summary.gained[e.item] = (summary.gained[e.item] ?? 0) + e.qty; break;
      case 'spend': summary.spent[e.item] = (summary.spent[e.item] ?? 0) + e.qty; break;
      case 'xp': summary.xp[e.skill] = (summary.xp[e.skill] ?? 0) + e.amount; break;
      case 'level': {
        const prev = summary.levels[e.skill];
        summary.levels[e.skill] = { from: prev?.from ?? e.level - 1, to: e.level };
        break;
      }
      case 'gold': summary.gold += e.amount; break;
      case 'kill': summary.kills[e.monster] = (summary.kills[e.monster] ?? 0) + 1; break;
      case 'defeat': summary.defeats += 1; break;
      case 'eat': summary.eaten[e.item] = (summary.eaten[e.item] ?? 0) + 1; break;
      case 'stop': summary.stop = e.reason; break;
    }
  };
}

export const summaryIsEmpty = (s: Summary) =>
  !Object.keys(s.gained).length && !Object.keys(s.xp).length && !s.gold && !s.defeats && !s.stop;
