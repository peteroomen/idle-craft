import { activity as activityDef } from '@/content/activities';
import { ITEMS } from '@/content/items';
import type { Item } from '@/content/items';
import type { Activity, ToolKind } from '@/content/types';
import type { Emit } from './events';
import { count, give, hasRoomFor, take } from './inventory';
import { level, type GameState } from './state';
import { addXp } from './xp';

/** Gathering without any tool is slower than the bronze starter tools. */
export const NO_TOOL_SPEED = 1.15;

/** The fastest tool of this kind you own and have the level to use. */
export function bestTool(s: GameState, kind: ToolKind): Item | null {
  let best: Item | null = null;
  for (const id of Object.keys(s.inventory)) {
    const it = ITEMS[id];
    if (!it?.tool || it.tool.kind !== kind || level(s, it.tool.skill) < it.tool.level) continue;
    if (!best || it.tool.speed < best.tool!.speed) best = it;
  }
  return best;
}

export function actionDuration(s: GameState, a: Activity): number {
  if (!a.toolKind) return a.duration;
  const tool = bestTool(s, a.toolKind);
  return Math.round(a.duration * (tool ? tool.tool!.speed : NO_TOOL_SPEED));
}

/** Why this activity can't start right now, or null if it can. */
export function cannotStart(s: GameState, a: Activity): string | null {
  if (level(s, a.skill) < a.level) return `Needs level ${a.level}`;
  for (const i of a.inputs ?? []) if (count(s, i.item) < i.qty) return `Out of ${ITEMS[i.item].name.toLowerCase()}`;
  for (const o of a.outputs) if (!hasRoomFor(s, o.item)) return 'Inventory full';
  return null;
}

export function stopAction(s: GameState, reason: string, emit: Emit) {
  s.action = null;
  emit({ type: 'stop', reason });
}

/** Runs the current activity for up to `left` ms. Returns the ms used. */
export function stepActivity(s: GameState, left: number, emit: Emit): number {
  const act = s.action;
  if (!act || act.type !== 'activity') return 0;
  const a = activityDef(act.id);
  if (act.progress === 0) {
    const why = cannotStart(s, a);
    if (why) { stopAction(s, why, emit); return 0; }
  }
  const need = Math.max(1, actionDuration(s, a) - act.progress);
  if (left < need) { act.progress += left; return left; }
  act.progress = 0;
  complete(s, a, emit);
  return need;
}

function complete(s: GameState, a: Activity, emit: Emit) {
  const why = cannotStart(s, a);
  if (why) { stopAction(s, why, emit); return; }
  for (const i of a.inputs ?? []) take(s, i.item, i.qty, emit);
  for (const o of a.outputs) give(s, o.item, o.qty, emit);
  addXp(s, a.skill, a.xp, emit);
  s.stats.actions += 1;
}
