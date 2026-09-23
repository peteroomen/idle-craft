'use client';

import { create } from 'zustand';
import { AWAY_THRESHOLD_MS, OFFLINE_CAP_HOURS } from '@/content/formulas';
import {
  SAVE_KEY, advance, catchUp, deserialize, emptySummary, newGame, serialize, summarise, summaryIsEmpty,
  type GameEvent, type GameState, type Summary,
} from '@/engine';

export type Away = { summary: Summary; elapsed: number; simulated: number };
export type Command<A extends unknown[]> = (s: GameState, ...args: A) => string | null;

type GameStore = {
  game: GameState | null;
  /** Events from the most recent visible tick, for toasts. */
  events: GameEvent[];
  tickId: number;
  away: Away | null;
  hidden: { since: number; summary: Summary } | null;
  load: (now: number) => void;
  tick: (now: number) => void;
  setHidden: (hidden: boolean, now: number) => void;
  run: <A extends unknown[]>(cmd: Command<A>, ...args: A) => string | null;
  replace: (s: GameState) => void;
  dismissAway: () => void;
  save: () => void;
  /** Dev tool: play `ms` of game time instantly, then show what happened. */
  warp: (ms: number) => void;
};

const HOUR = 3_600_000;
const capFor = (s: GameState) => OFFLINE_CAP_HOURS[Math.min(s.upgrades.offline, OFFLINE_CAP_HOURS.length - 1)] * HOUR;

function readSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? deserialize(raw) : null;
  } catch {
    return null;
  }
}

function writeSave(s: GameState) {
  try { localStorage.setItem(SAVE_KEY, serialize(s)); } catch { /* storage full or blocked */ }
}

export const useGame = create<GameStore>((set, get) => ({
  game: null,
  events: [],
  tickId: 0,
  away: null,
  hidden: null,

  load(now) {
    const saved = readSave();
    const s = saved ?? newGame(now);
    if (!saved) { set({ game: s }); writeSave(s); return; }
    const summary = emptySummary();
    const r = catchUp(s, now, capFor(s), summarise(summary));
    summary.ms = r.simulated;
    set({ game: s, away: r.elapsed > AWAY_THRESHOLD_MS && !summaryIsEmpty(summary) ? { summary, ...r } : null });
    writeSave(s);
  },

  tick(now) {
    const { game, hidden } = get();
    if (!game) return;
    const dt = now - game.now;
    if (dt <= 0) return;
    const s = structuredClone(game);
    if (hidden) {
      // Throttled background ticks: collect quietly, report when the player comes back.
      if (dt > AWAY_THRESHOLD_MS) catchUp(s, now, capFor(s), summarise(hidden.summary));
      else advance(s, dt, summarise(hidden.summary));
      set({ game: s });
      return;
    }
    if (dt > AWAY_THRESHOLD_MS) {
      // The page was frozen (sleep, app switch): treat it as time away.
      const summary = emptySummary();
      const r = catchUp(s, now, capFor(s), summarise(summary));
      summary.ms = r.simulated;
      set({ game: s, away: summaryIsEmpty(summary) ? get().away : { summary, ...r } });
      writeSave(s);
      return;
    }
    const events: GameEvent[] = [];
    advance(s, dt, (e) => events.push(e));
    set({ game: s, events, tickId: get().tickId + 1 });
  },

  setHidden(isHidden, now) {
    const { hidden, game } = get();
    if (isHidden) {
      if (!hidden) set({ hidden: { since: now, summary: emptySummary() } });
      if (game) writeSave(game);
      return;
    }
    if (!hidden) return;
    get().tick(now);
    const elapsed = now - hidden.since;
    hidden.summary.ms = elapsed;
    set({
      hidden: null,
      away: elapsed > AWAY_THRESHOLD_MS && !summaryIsEmpty(hidden.summary) ? { summary: hidden.summary, elapsed, simulated: elapsed } : get().away,
    });
  },

  run(cmd, ...args) {
    const { game } = get();
    if (!game) return 'Loading';
    const s = structuredClone(game);
    const err = cmd(s, ...args);
    if (err) return err;
    set({ game: s });
    writeSave(s);
    return null;
  },

  replace(s) {
    set({ game: s, away: null, events: [] });
    writeSave(s);
  },

  dismissAway: () => set({ away: null }),

  warp(ms) {
    const { game } = get();
    if (!game) return;
    const s = structuredClone(game);
    const summary = emptySummary();
    advance(s, ms, summarise(summary));
    summary.ms = ms;
    s.now = Date.now();
    set({ game: s, away: { summary, elapsed: ms, simulated: ms } });
    writeSave(s);
  },
  save() {
    const { game } = get();
    if (game) writeSave(game);
  },
}));
