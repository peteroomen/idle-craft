'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Grid, Segmented, Tag, theme, Typography } from 'antd';
import { activitiesFor, ACTIVITIES } from '@/content/activities';
import { skillByRoute } from '@/content/skills';
import type { ToolKind } from '@/content/types';
import { bestTool, NO_TOOL_SPEED } from '@/engine';
import { useGame } from '@/store/game';
import { useSkill } from '@/store/hooks';
import Activity from './activity';
import CurrentActivity from './current-activity';
import Icon from './icon';
import PageTitle from './page-title';
import SkillInfo from './skill-info';

const TOOL_FOR: Partial<Record<string, ToolKind>> = { woodcutting: 'axe', mining: 'pickaxe', fishing: 'rod' };
const STANCE_FOR: Record<string, string> = { attack: 'Accurate', strength: 'Aggressive', defense: 'Defensive', ranged: 'Accurate or Aggressive with a bow', hitpoints: 'any stance' };

export default function SkillView({ route }: { route: string }) {
  const skill = skillByRoute(route);
  const { pct } = useSkill(skill?.id ?? 'woodcutting');
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const activities = useMemo(() => (skill ? activitiesFor(skill.id) : []), [skill]);
  const categories = useMemo(() => [...new Set(activities.map((a) => a.category).filter(Boolean))] as string[], [activities]);
  const activeCategory = useGame((s) => (s.game?.action?.type === 'activity' ? ACTIVITIES[s.game.action.id]?.category : undefined));
  const [picked, setPicked] = useState<string>();
  const category = picked ?? (activeCategory && categories.includes(activeCategory) ? activeCategory : categories[0]);
  const toolKind = skill ? TOOL_FOR[skill.id] : undefined;
  const tool = useGame((s) => (s.game && toolKind ? bestTool(s.game, toolKind) : null));
  const wide = Grid.useBreakpoint().lg !== false;

  if (!skill) return null;
  const shown = category ? activities.filter((a) => a.category === category) : activities;

  return (
    <div className="flex flex-col gap-4">
      <PageTitle icon={skill.icon} title={skill.name} percent={pct} endContent={wide ? <CurrentActivity /> : undefined}>
        <SkillInfo skill={skill.id} />
      </PageTitle>

      {toolKind && (
        <div className="flex flex-row flex-wrap items-center gap-2">
          <span className="opacity-70">Tool</span>
          {tool ? (
            <Tag icon={<Icon imgPath={tool.icon} className="-my-2 mr-1" />} style={{ display: 'inline-flex', alignItems: 'center' }}>
              {tool.name} · {tool.tool!.speed < 1 ? `${Math.round((1 - tool.tool!.speed) * 100)}% faster` : 'base speed'}
            </Tag>
          ) : (
            <Tag color="warning">No {toolKind}: {Math.round((NO_TOOL_SPEED - 1) * 100)}% slower</Tag>
          )}
        </div>
      )}

      {categories.length > 1 && (
        <div className="overflow-x-auto">
          <Segmented value={category} onChange={(v) => setPicked(v as string)} options={categories} />
        </div>
      )}

      {skill.isCombat ? (
        <div className="flex flex-col gap-2 p-4" style={{ backgroundColor: colorBgContainer, borderRadius: borderRadiusLG }}>
          <Typography.Text>
            {skill.name} trains in Encounters. {skill.id === 'hitpoints' ? 'It gains XP with every hit you land, in any stance.' : `Fight with the ${STANCE_FOR[skill.id]} stance.`}
          </Typography.Text>
          <Link href="/combat/encounters/"><Button type="primary">Go to Encounters</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))' }}>
          {shown.map((a) => <Activity key={a.id} activity={a} />)}
        </div>
      )}
    </div>
  );
}
