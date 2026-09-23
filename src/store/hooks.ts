'use client';

import { useShallow } from 'zustand/react/shallow';
import { XP_TABLE, levelForXp, MAX_LEVEL } from '@/content/formulas';
import type { ItemId, SkillId } from '@/content/types';
import { capacity, maxHp, slotsUsed, totalLevel } from '@/engine';
import { useGame } from './game';

export const useReady = () => useGame((s) => s.game !== null);
export const useGold = () => useGame((s) => s.game?.gold ?? 0);
export const useAction = () => useGame((s) => s.game?.action ?? null);
export const useCount = (item: ItemId) => useGame((s) => s.game?.inventory[item] ?? 0);
export const useInventory = () => useGame((s) => s.game?.inventory ?? {});
export const useEquipment = () => useGame((s) => s.game?.equipment ?? {});

export function useSkill(skill: SkillId) {
  return useGame(useShallow((s) => {
    const xp = s.game?.xp[skill] ?? 0;
    const level = levelForXp(xp);
    const lo = XP_TABLE[level], hi = level >= MAX_LEVEL ? XP_TABLE[MAX_LEVEL] : XP_TABLE[level + 1];
    return { xp, level, lo, hi, pct: level >= MAX_LEVEL ? 100 : ((xp - lo) / (hi - lo)) * 100 };
  }));
}

export const useSlots = () => useGame(useShallow((s) => (s.game ? { used: slotsUsed(s.game), cap: capacity(s.game) } : { used: 0, cap: 0 })));
export const useHp = () => useGame(useShallow((s) => (s.game ? { hp: s.game.hp, max: maxHp(s.game) } : { hp: 0, max: 0 })));
export const useTotalLevel = () => useGame((s) => (s.game ? totalLevel(s.game) : 0));
