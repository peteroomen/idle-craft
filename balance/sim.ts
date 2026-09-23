// npm run sim -- [--hours 200] [--skill woodcutting] [--block 1]
// A bot plays the real engine: it rotates the gathering skills (or trains one), always on the best
// node it can use, sells what it gathers and buys the best tool it can afford.
import { ACTIVITY_LIST } from '@/content/activities';
import { ITEMS } from '@/content/items';
import { LISTINGS } from '@/content/shop';
import type { SkillId } from '@/content/types';
import { advance, bestTool, buy, emptySummary, level, newGame, sell, startActivity, summarise, type GameState } from '@/engine';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const HOURS = Number(arg('hours', '200'));
const BLOCK = Number(arg('block', '1'));
const ONLY = arg('skill', '') as SkillId | '';
const SKILLS = (ONLY ? [ONLY] : ['woodcutting', 'mining', 'fishing']) as ('woodcutting' | 'mining' | 'fishing')[];
const HOUR = 3_600_000;
const TOOL = { woodcutting: 'axe', mining: 'pickaxe', fishing: 'rod' } as const;

function prepare(s: GameState, skill: (typeof SKILLS)[number]) {
  for (const [id, n] of Object.entries(s.inventory)) if (ITEMS[id].category !== 'tool') sell(s, id, n);
  const current = bestTool(s, TOOL[skill])?.tool?.speed ?? 2;
  const upgrades = LISTINGS.filter((l) => l.kind === 'item' && ITEMS[l.item].tool?.kind === TOOL[skill] && ITEMS[l.item].tool!.level <= level(s, skill) && ITEMS[l.item].tool!.speed < current);
  for (const t of upgrades.reverse()) if (t.kind === 'item' && s.gold >= t.price) { buy(s, t.id); break; }
  const best = ACTIVITY_LIST.filter((a) => a.skill === skill && a.level <= level(s, skill) && a.id !== 'mine_tin').sort((a, b) => b.level - a.level)[0];
  startActivity(s, best.id);
}

const s = newGame(0, 42);
const reached: Partial<Record<SkillId, number>> = {};
const rows: string[] = [];
const header = ['Hour', ...SKILLS.map((k) => k[0].toUpperCase() + k.slice(1)), 'Gold', 'Tools'];
for (let hour = 0; hour < HOURS; hour += BLOCK) {
  const skill = SKILLS[Math.floor(hour / BLOCK) % SKILLS.length];
  prepare(s, skill);
  const summary = emptySummary();
  advance(s, BLOCK * HOUR, summarise(summary));
  for (const k of SKILLS) if (level(s, k) >= 99 && reached[k] === undefined) reached[k] = hour + BLOCK;
  const h = hour + BLOCK;
  if (h <= 10 || h % 10 === 0 || h === HOURS) {
    const tools = SKILLS.map((k) => bestTool(s, TOOL[k])?.name ?? 'none').join(', ');
    rows.push([h, ...SKILLS.map((k) => level(s, k)), s.gold.toLocaleString('en-NZ'), tools].join(' | '));
  }
}
console.log(`| ${header.join(' | ')} |\n| ${header.map(() => '---').join(' | ')} |`);
for (const r of rows) console.log(`| ${r} |`);
for (const k of SKILLS) console.log(`${k}: ${reached[k] !== undefined ? `99 after ${reached[k]} h of play (${(reached[k]! / SKILLS.length).toFixed(1)} h training it)` : `level ${level(s, k)} after ${HOURS} h`}`);
