import { ITEMS } from '@/content/items';
import { SKILLS } from '@/content/skills';
import { newGame, SAVE_VERSION, type GameState } from './state';

export const SAVE_KEY = 'ironbark:save';

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;
/** MIGRATIONS[n] upgrades a version-n save to n+1. */
const MIGRATIONS: Record<number, Migration> = {};

export const serialize = (s: GameState) => JSON.stringify(s);

/** Parse, migrate and repair a save. Unknown items are dropped; missing fields get defaults. */
export function deserialize(json: string): GameState | null {
  let raw: Record<string, unknown>;
  try { raw = JSON.parse(json); } catch { return null; }
  if (!raw || typeof raw !== 'object' || typeof raw.version !== 'number' || typeof raw.now !== 'number') return null;
  for (let v = raw.version as number; v < SAVE_VERSION; v++) {
    raw = MIGRATIONS[v]?.(raw) ?? raw;
    raw.version = v + 1;
  }
  const base = newGame(raw.now as number);
  const s = { ...base, ...raw } as GameState;
  s.xp = { ...base.xp, ...(raw.xp as object) };
  for (const k of Object.keys(s.xp)) if (!SKILLS.some((sk) => sk.id === k)) delete (s.xp as Record<string, number>)[k];
  s.inventory = Object.fromEntries(Object.entries((raw.inventory as Record<string, number>) ?? {}).filter(([id, n]) => ITEMS[id] && n > 0));
  s.equipment = Object.fromEntries(Object.entries((raw.equipment as Record<string, string>) ?? {}).filter(([, id]) => ITEMS[id]));
  s.upgrades = { ...base.upgrades, ...(raw.upgrades as object) };
  s.stats = { ...base.stats, ...(raw.stats as object) };
  if (s.food && !ITEMS[s.food]) s.food = null;
  return s;
}

/** A copy-pasteable save string (base64 of the UTF-8 JSON). */
export function exportSave(s: GameState): string {
  const bytes = new TextEncoder().encode(serialize(s));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
export function importSave(text: string): GameState | null {
  try {
    const bin = atob(text.trim());
    return deserialize(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
  } catch {
    return null;
  }
}
