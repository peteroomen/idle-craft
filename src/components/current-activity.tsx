'use client';

import Link from 'next/link';
import { Progress } from 'antd';
import { ACTIVITIES } from '@/content/activities';
import { SKILL_BY_ID } from '@/content/skills';
import { actionDuration } from '@/engine';
import { gerund } from '@/lib/format';
import { useShallow } from 'zustand/react/shallow';
import { useGame } from '@/store/game';
import Icon from './icon';

// Peter's current-activity widget: what's running, and how far through the current action.
export default function CurrentActivity({ compact = false }: { compact?: boolean }) {
  const info = useGame(useShallow((s) => {
    const g = s.game, a = g?.action;
    if (!g || !a) return null;
    if (a.type === 'activity') {
      const def = ACTIVITIES[a.id];
      return { href: `/skills/${SKILL_BY_ID[def.skill].routeName}/`, icon: def.icon, text: `${gerund(def.action)} ${def.name.toLowerCase()}`, pct: Math.round((a.progress / actionDuration(g, def)) * 100) };
    }
    return { href: '/combat/encounters/', icon: '/icons/sword-3.png', text: 'Fighting', pct: 0 };
  }));

  if (!info) return compact ? null : <span className="opacity-60">Idle</span>;

  return (
    <Link href={info.href} className="flex flex-row items-center gap-2 min-w-0" style={{ color: 'inherit' }}>
      {!compact && <Icon imgPath={info.icon} />}
      <span className="truncate">{info.text}</span>
      <Progress type="circle" percent={info.pct} size={compact ? 28 : 40} format={() => ''} />
    </Link>
  );
}
