'use client';

import { App, Button, Progress, Segmented, Select, Tag, theme, Tooltip, Typography } from 'antd';
import { useShallow } from 'zustand/react/shallow';
import { combatLevel } from '@/content/formulas';
import { ITEMS } from '@/content/items';
import { MONSTERS, ZONES, type Monster } from '@/content/monsters';
import { METALS } from '@/content/tiers';
import { combatStats, eatNow, fightOdds, foodToEat, level, maxHp, setFood, setStance, startCombat, stop, type Stance } from '@/engine';
import { fmt, secs } from '@/lib/format';
import { useGame } from '@/store/game';
import Icon from './icon';

const STANCES: { value: Stance; label: string; melee: string; ranged: string }[] = [
  { value: 'accurate', label: 'Accurate', melee: 'Attack', ranged: 'Ranged' },
  { value: 'aggressive', label: 'Aggressive', melee: 'Strength', ranged: 'Ranged' },
  { value: 'defensive', label: 'Defensive', melee: 'Defense', ranged: 'Defense' },
  { value: 'controlled', label: 'Controlled', melee: 'All three', ranged: 'Ranged + Defense' },
];
const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function EncountersView() {
  const cmb = useGame((s) => (s.game ? combatLevel(level(s.game, 'attack'), level(s.game, 'strength'), level(s.game, 'defense'), level(s.game, 'ranged'), level(s.game, 'hitpoints')) : 3));
  const fighting = useGame((s) => (s.game?.action?.type === 'combat' ? s.game.action.monsterId : null));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row flex-wrap items-center gap-3">
        <Typography.Title level={3} style={{ margin: 0 }}>Encounters</Typography.Title>
        <Tag>Combat level {cmb}</Tag>
      </div>
      <Controls />
      {fighting && <Fight monster={MONSTERS[fighting]} />}
      {ZONES.map((z) => (
        <section key={z.id} className="flex flex-col gap-2">
          <div className="flex flex-row flex-wrap items-baseline gap-2">
            <Typography.Title level={4} style={{ margin: 0 }}>{z.name}</Typography.Title>
            <Tag color={METALS[z.tier - 1].color} style={{ color: '#140c1c' }}>Tier {z.tier}</Tag>
            <Typography.Text type="secondary">{z.blurb}</Typography.Text>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {z.monsters.map((m) => <MonsterCard key={m.id} monster={m} active={fighting === m.id} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function Controls() {
  const { message } = App.useApp();
  const run = useGame((s) => s.run);
  const view = useGame(useShallow((s) => {
    const g = s.game;
    if (!g) return null;
    const st = combatStats(g);
    const foods = Object.keys(g.inventory).filter((id) => ITEMS[id]?.heals).sort((a, b) => ITEMS[b].heals! - ITEMS[a].heals!).join(',');
    return { stance: g.stance, style: st.style, food: g.food, eating: foodToEat(g), foods, hp: g.hp, max: maxHp(g), autoEat: g.upgrades.autoEat };
  }));
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  if (!view) return null;
  const foods = view.foods ? view.foods.split(',') : [];
  const threshold = [30, 50, 50][view.autoEat];

  return (
    <div className="flex flex-col lg:flex-row flex-wrap gap-4 p-4" style={{ background: colorBgContainer, borderRadius: borderRadiusLG }}>
      <div className="flex flex-col gap-1">
        <Typography.Text type="secondary">Stance — trains</Typography.Text>
        <div className="overflow-x-auto">
          <Segmented
            value={view.stance}
            onChange={(v) => run(setStance, v as Stance)}
            options={STANCES.map((st) => ({ value: st.value, label: <div className="py-1 leading-tight"><div>{st.label}</div><div className="text-[11px] opacity-60">{view.style === 'ranged' ? st.ranged : st.melee}</div></div> }))}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <Typography.Text type="secondary">Food — auto-eat below {threshold}% HP</Typography.Text>
        <div className="flex flex-row gap-2">
          <Select
            style={{ minWidth: 200 }}
            value={view.food ?? 'best'}
            onChange={(v) => run(setFood, v === 'best' ? null : v)}
            options={[{ value: 'best', label: view.eating ? `Best available (${ITEMS[view.eating].name})` : 'Best available (none)' }, ...foods.map((id) => ({ value: id, label: `${ITEMS[id].name} · heals ${ITEMS[id].heals}` }))]}
            aria-label="Food"
          />
          <Button onClick={() => { const e = run(eatNow); if (e) message.warning(e); }}>Eat</Button>
        </div>
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
        <Typography.Text type="secondary">Hitpoints</Typography.Text>
        <Progress percent={Math.round((view.hp / view.max) * 100)} strokeColor="#e0566a" format={() => `${fmt(view.hp)} / ${fmt(view.max)}`} />
      </div>
    </div>
  );
}

function Bars({ hp, max, timer, speed, color }: { hp: number; max: number; timer: number; speed: number; color: string }) {
  return (
    <>
      <Progress percent={Math.max(0, Math.round((hp / max) * 100))} strokeColor={color} format={() => `${fmt(Math.max(0, hp))}/${fmt(max)}`} style={{ margin: 0 }} />
      <Progress percent={Math.round((1 - timer / speed) * 100)} showInfo={false} size="small" strokeColor="rgba(255,255,255,.55)" style={{ margin: 0 }} />
    </>
  );
}

function Fight({ monster }: { monster: Monster }) {
  const run = useGame((s) => s.run);
  const v = useGame(useShallow((s) => {
    const g = s.game!, a = g.action;
    if (!a || a.type !== 'combat') return null;
    const st = combatStats(g), odds = fightOdds(g, monster.id);
    return {
      hp: g.hp, max: maxHp(g), pTimer: a.respawn > 0 ? st.speed : a.playerTimer, pSpeed: st.speed, mHp: a.respawn > 0 ? 0 : a.monsterHp, mTimer: a.respawn > 0 ? monster.speed : a.monsterTimer,
      maxHit: st.maxHit, yourHit: odds.yourHit, theirHit: odds.theirHit, kill: odds.killSeconds, xph: odds.xpPerHour, respawn: a.respawn, kills: g.stats.kills,
      ammo: st.style === 'ranged' && st.ammo ? `${ITEMS[st.ammo].name} ×${fmt(st.ammoCount)}` : null,
    };
  }));
  const { token: { colorBgContainer, borderRadiusLG, colorPrimaryBorder } } = theme.useToken();
  if (!v) return null;

  return (
    <div className="flex flex-col gap-3 p-4" style={{ background: colorBgContainer, borderRadius: borderRadiusLG, border: `1px solid ${colorPrimaryBorder}` }}>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-row items-center gap-2 font-bold"><Icon imgPath="/icons/heart.png" alt="" />You</div>
          <Bars hp={v.hp} max={v.max} timer={v.pTimer} speed={v.pSpeed} color="#e0566a" />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Max hit {fmt(v.maxHit)} · hits {pct(v.yourHit)} · {secs(v.pSpeed)}</Typography.Text>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-row items-center gap-2 font-bold"><Icon imgPath={monster.icon} alt="" />{monster.name} <span className="font-normal opacity-60">Lv {monster.level}</span></div>
          <Bars hp={v.mHp} max={monster.hp} timer={v.mTimer} speed={monster.speed} color="#e0566a" />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{v.respawn > 0 ? 'Next one arriving…' : `Max hit ${fmt(monster.maxHit)} · hits you ${pct(v.theirHit)} · ${secs(monster.speed)}`}</Typography.Text>
        </div>
      </div>
      <div className="flex flex-row flex-wrap items-center gap-3">
        <Tag>~{Math.round(v.kill)} s per kill</Tag>
        <Tag>~{fmt(v.xph)} XP/h</Tag>
        {v.ammo && <Tag>{v.ammo}</Tag>}
        <Tag>{fmt(v.kills)} kills all-time</Tag>
        <div className="flex-grow" />
        <Button onClick={() => run(stop)}>Run away</Button>
      </div>
    </div>
  );
}

function MonsterCard({ monster, active }: { monster: Monster; active: boolean }) {
  const { message } = App.useApp();
  const run = useGame((s) => s.run);
  const odds = useGame(useShallow((s) => {
    const o = fightOdds(s.game!, monster.id);
    return { yourHit: o.yourHit, theirHit: o.theirHit, kill: Math.round(o.killSeconds), taken: Math.round(o.damageTakenPerKill), max: maxHp(s.game!) };
  }));
  const { token: { colorBgContainer, borderRadiusLG, colorPrimary, colorError, colorWarning } } = theme.useToken();
  const danger = odds.taken > odds.max * 0.5 ? colorError : odds.taken > odds.max * 0.2 ? colorWarning : undefined;
  const loot = monster.drops.map((d) => ITEMS[d.item]);

  return (
    <div className="flex flex-col gap-2 p-3" style={{ background: colorBgContainer, borderRadius: borderRadiusLG, outline: active ? `2px solid ${colorPrimary}` : 'none' }}>
      <div className="flex flex-row items-center gap-3">
        <Icon imgPath={monster.icon} size="lg" alt={monster.name} />
        <div className="flex flex-col min-w-0">
          <b>{monster.name}</b>
          <span className="text-xs opacity-70">Level {monster.level} · {monster.archetype} · {fmt(monster.hp)} HP</span>
          <span className="text-xs" style={{ color: danger }}>
            You hit {pct(odds.yourHit)} · it hits {pct(odds.theirHit)} for up to {monster.maxHit}
          </span>
          <span className="text-xs opacity-70">~{odds.kill} s per kill · ~{fmt(odds.taken)} damage taken each</span>
        </div>
      </div>
      <div className="flex flex-row items-center gap-1">
        {loot.map((it) => <Tooltip key={it.id} title={it.name}><span><Icon imgPath={it.icon} alt={it.name} /></span></Tooltip>)}
        <div className="flex-grow" />
        {active ? <Button onClick={() => run(stop)}>Run away</Button> : <Button type="primary" onClick={() => { const e = run(startCombat, monster.id); if (e) message.warning(e); }}>Fight</Button>}
      </div>
    </div>
  );
}

