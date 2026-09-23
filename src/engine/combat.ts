import { AUTO_EAT, HITPOINTS_XP_SHARE, RESPAWN_MS, XP_PER_DAMAGE, hitChance } from '@/content/formulas';
import { ITEMS } from '@/content/items';
import { MONSTERS, type Monster } from '@/content/monsters';
import type { ItemId, SkillId } from '@/content/types';
import { combatStats } from './equipment';
import { ignore, type Emit } from './events';
import { count, give, take } from './inventory';
import { random, randInt } from './rng';
import { maxHp, type GameState, type Stance } from './state';
import { addXp } from './xp';

type CombatAction = Extract<NonNullable<GameState['action']>, { type: 'combat' }>;

/** Why a fight can't start, or null. */
export function cannotFight(s: GameState, monsterId: string): string | null {
  if (!MONSTERS[monsterId]) return 'No such monster';
  const st = combatStats(s);
  if (st.style === 'ranged' && (!st.ammo || st.ammoCount <= 0)) return 'Equip some arrows first';
  if (s.hp <= maxHp(s) * 0.1 && !foodToEat(s)) return 'Too hurt to fight — rest or bring food';
  return null;
}

export function startCombat(s: GameState, monsterId: string): string | null {
  const why = cannotFight(s, monsterId);
  if (why) return why;
  const m = MONSTERS[monsterId];
  s.action = { type: 'combat', monsterId, monsterHp: m.hp, playerTimer: combatStats(s).speed, monsterTimer: m.speed, respawn: 0 };
  return null;
}

export function setStance(s: GameState, stance: Stance): string | null {
  s.stance = stance;
  return null;
}

/** The chosen food, or the best-healing fish you carry if none is chosen. */
export function foodToEat(s: GameState): ItemId | null {
  if (s.food && count(s, s.food) > 0) return s.food;
  let best: ItemId | null = null;
  for (const id of Object.keys(s.inventory)) {
    const h = ITEMS[id]?.heals;
    if (h && (!best || h > ITEMS[best].heals!)) best = id;
  }
  return best;
}

export function setFood(s: GameState, item: ItemId | null): string | null {
  if (item && !ITEMS[item]?.heals) return "That isn't food";
  s.food = item;
  return null;
}

export function eat(s: GameState, emit: Emit): boolean {
  const food = foodToEat(s);
  if (!food) return false;
  const max = maxHp(s);
  if (s.hp >= max) return false;
  take(s, food, 1, emit);
  const heal = Math.min(ITEMS[food].heals!, max - s.hp);
  s.hp += heal;
  emit({ type: 'eat', item: food, heal });
  return true;
}

/** The Eat button. */
export function eatNow(s: GameState): string | null {
  if (eat(s, ignore)) return null;
  return foodToEat(s) ? 'Already at full health' : 'No food';
}

function autoEat(s: GameState, emit: Emit) {
  const rule = AUTO_EAT[Math.min(s.upgrades.autoEat, AUTO_EAT.length - 1)];
  const max = maxHp(s);
  if (s.hp >= max * rule.threshold) return;
  while (s.hp < max * rule.threshold || (rule.toFull && s.hp < max * 0.95)) {
    if (!eat(s, emit)) break;
  }
}

/** Which skills a hit trains, by stance and style. */
export function xpSplit(style: 'melee' | 'ranged', stance: Stance): SkillId[] {
  if (style === 'ranged') return stance === 'defensive' ? ['defense'] : stance === 'controlled' ? ['ranged', 'defense'] : ['ranged'];
  return stance === 'accurate' ? ['attack'] : stance === 'aggressive' ? ['strength'] : stance === 'defensive' ? ['defense'] : ['attack', 'strength', 'defense'];
}

function awardKill(s: GameState, m: Monster, emit: Emit) {
  const gold = Math.round(m.gold * (0.8 + 0.4 * random(s)));
  s.gold += gold;
  s.stats.goldEarned += gold;
  emit({ type: 'gold', amount: gold });
  for (const d of m.drops) if (random(s) < d.chance) give(s, d.item, randInt(s, d.min, d.max), emit);
  s.stats.kills += 1;
  emit({ type: 'kill', monster: m.id });
}

/** Runs the current fight for up to `left` ms, one attack at a time. Returns the ms used. */
export function stepCombat(s: GameState, left: number, emit: Emit): number {
  const a = s.action as CombatAction;
  const m = MONSTERS[a.monsterId];
  if (!m) { s.action = null; return 0; }
  const st = combatStats(s);

  if (a.respawn > 0) {
    const dt = Math.min(left, a.respawn);
    a.respawn -= dt;
    if (a.respawn <= 0) { a.monsterHp = m.hp; a.playerTimer = st.speed; a.monsterTimer = m.speed; }
    return dt;
  }

  const dt = Math.max(0, Math.min(left, a.playerTimer, a.monsterTimer));
  a.playerTimer -= dt;
  a.monsterTimer -= dt;

  if (a.playerTimer <= 0) {
    if (st.style === 'ranged' && (!st.ammo || !take(s, st.ammo, 1, emit))) {
      s.action = null;
      emit({ type: 'stop', reason: 'Out of arrows' });
      return dt;
    }
    a.playerTimer += st.speed;
    if (random(s) < hitChance(st.attackRating, m.defense)) {
      const dmg = Math.min(a.monsterHp, randInt(s, 1, st.maxHit));
      a.monsterHp -= dmg;
      const skills = xpSplit(st.style, s.stance);
      for (const k of skills) addXp(s, k, (dmg * XP_PER_DAMAGE) / skills.length, emit);
      addXp(s, 'hitpoints', dmg * XP_PER_DAMAGE * HITPOINTS_XP_SHARE, emit);
    }
    if (a.monsterHp <= 0) {
      awardKill(s, m, emit);
      a.respawn = RESPAWN_MS;
      return dt;
    }
  }

  if (a.monsterTimer <= 0) {
    a.monsterTimer += m.speed;
    if (random(s) < hitChance(m.attack, st.defenseRating)) s.hp -= randInt(s, 1, m.maxHit);
    autoEat(s, emit);
    if (s.hp <= 0) {
      s.hp = 1;
      s.action = null;
      emit({ type: 'defeat', monster: m.id });
      emit({ type: 'stop', reason: `Defeated by ${m.name}` });
    }
  }
  return dt;
}

/** Expected numbers for a fight with current gear: shown on the Encounters page and used by the balance report. */
export function fightOdds(s: GameState, monsterId: string) {
  const m = MONSTERS[monsterId];
  const st = combatStats(s);
  const yourHit = hitChance(st.attackRating, m.defense);
  const theirHit = hitChance(m.attack, st.defenseRating);
  const yourDps = (yourHit * (st.maxHit + 1)) / 2 / (st.speed / 1000);
  const killSeconds = m.hp / yourDps;
  const damageTakenPerKill = ((theirHit * (m.maxHit + 1)) / 2 / (m.speed / 1000)) * killSeconds;
  const killsPerHour = 3600 / (killSeconds + RESPAWN_MS / 1000);
  return { yourHit, theirHit, killSeconds, damageTakenPerKill, killsPerHour, xpPerHour: killsPerHour * m.hp * XP_PER_DAMAGE };
}
