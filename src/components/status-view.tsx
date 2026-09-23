'use client';

import Link from 'next/link';
import { Alert, Button, Card, Progress, Statistic, Typography } from 'antd';
import { SKILLS } from '@/content/skills';
import type { Skill } from '@/content/types';
import { MAX_LEVEL } from '@/content/formulas';
import { fmt } from '@/lib/format';
import { useGold, useHp, useSkill, useSlots, useTotalLevel } from '@/store/hooks';
import Icon from './icon';
import SavePanel from './save-panel';
import { useGame } from '@/store/game';

export default function StatusView() {
  const gold = useGold();
  const total = useTotalLevel();
  const { hp, max } = useHp();
  const { used, cap } = useSlots();
  const fresh = useGame((s) => !!s.game && s.game.stats.actions === 0 && s.game.stats.kills === 0);
  return (
    <div className="flex flex-col gap-4">
      <Typography.Title level={3} style={{ margin: 0 }}>Status</Typography.Title>
      {fresh && (
        <Alert
          type="info"
          showIcon
          message="Welcome to Ironbark"
          description={
            <div className="flex flex-col gap-2">
              <span>Start by cutting some pine. Your axe keeps swinging while you&apos;re away, for up to 12 hours. Sell logs in the Inventory, buy better tools in the Shop, and work your way up to Magic trees.</span>
              <Link href="/skills/woodcutting/"><Button type="primary">Go to Woodcutting</Button></Link>
            </div>
          }
        />
      )}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <Card size="small"><Statistic title="Gold" value={gold} prefix={<Icon imgPath="/icons/coin.png" alt="" />} /></Card>
        <Card size="small"><Statistic title="Total level" value={total} suffix={`/ ${SKILLS.length * MAX_LEVEL}`} /></Card>
        <Card size="small"><Statistic title="Hitpoints" value={hp} suffix={`/ ${max}`} prefix={<Icon imgPath="/icons/heart.png" alt="" />} /></Card>
        <Card size="small"><Statistic title="Inventory" value={used} suffix={`/ ${cap} slots`} /></Card>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {SKILLS.map((s) => <SkillRow key={s.id} skill={s} />)}
      </div>
      <SavePanel />
    </div>
  );
}

function SkillRow({ skill }: { skill: Skill }) {
  const { level, xp, pct } = useSkill(skill.id);
  return (
    <Link href={`/skills/${skill.routeName}/`} style={{ color: 'inherit' }}>
      <Card size="small" hoverable>
        <div className="flex flex-row items-center gap-3">
          <Icon imgPath={skill.icon} alt="" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-row justify-between"><b>{skill.name}</b><span>{level} / {MAX_LEVEL}</span></div>
            <Progress percent={Number(pct.toFixed(1))} size="small" showInfo={false} style={{ margin: 0 }} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{fmt(xp)} XP</Typography.Text>
          </div>
        </div>
      </Card>
    </Link>
  );
}
