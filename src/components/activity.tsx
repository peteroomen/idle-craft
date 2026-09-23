'use client';

import { App, Button, Progress, Tag, theme, Tooltip } from 'antd';
import { useShallow } from 'zustand/react/shallow';
import { ITEMS } from '@/content/items';
import type { Activity as IActivity } from '@/content/types';
import { actionDuration, startActivity, stop } from '@/engine';
import { secs } from '@/lib/format';
import { useGame } from '@/store/game';
import { useSkill } from '@/store/hooks';
import Icon from './icon';

// Peter's activity card, now driven by the engine: progress lives in the game state, so it
// survives page changes, refreshes and closing the tab.
export default function Activity({ activity }: { activity: IActivity }) {
  const { token: { colorBgContainer, borderRadiusLG, colorError } } = theme.useToken();
  const { message } = App.useApp();
  const run = useGame((s) => s.run);
  const { level } = useSkill(activity.skill);
  const view = useGame(useShallow((s) => {
    const g = s.game, a = g?.action;
    const active = a?.type === 'activity' && a.id === activity.id;
    const duration = g ? actionDuration(g, activity) : activity.duration;
    return {
      active,
      duration,
      pct: active ? Math.round((a.progress / duration) * 1000) / 10 : 0,
      have: (activity.inputs ?? []).map((i) => g?.inventory[i.item] ?? 0).join(','),
    };
  }));
  const have = view.have ? view.have.split(',').map(Number) : [];
  const locked = level < activity.level;
  const short = (activity.inputs ?? []).some((i, n) => (have[n] ?? 0) < i.qty);

  const start = () => {
    const err = run(startActivity, activity.id);
    if (err) message.warning(err);
  };

  return (
    <div className="flex flex-col relative overflow-hidden" style={{ backgroundColor: colorBgContainer, borderRadius: borderRadiusLG, opacity: locked ? 0.7 : 1 }}>
      {view.active && (
        <Progress
          type="line"
          percent={view.pct}
          showInfo={false}
          size={{ height: borderRadiusLG }}
          style={{ margin: 0, height: `${borderRadiusLG}px`, lineHeight: `${borderRadiusLG}px`, transition: 'none', position: 'absolute', top: 0, left: 0, right: 0 }}
        />
      )}
      <div className="flex flex-col items-center gap-2 p-4">
        <div className="flex flex-col items-center text-center">
          <div className="text-xs">{activity.action}</div>
          <div className="font-bold">{activity.name}</div>
          <div className="text-xs">{locked ? <span style={{ color: colorError }}>Level {activity.level}</span> : <>{activity.xp} XP / {secs(view.duration)}</>}</div>
        </div>
        <Icon imgPath={activity.icon} size="lg" alt={activity.name} />
        {activity.inputs && (
          <div className="flex flex-row flex-wrap justify-center gap-2">
            {activity.inputs.map((i, n) => (
              <Tooltip key={i.item} title={ITEMS[i.item].name}>
                <span className="flex flex-row items-center text-xs" style={{ color: have[n] < i.qty ? colorError : undefined }}>
                  <Icon imgPath={ITEMS[i.item].icon} alt={ITEMS[i.item].name} />
                  {have[n]}/{i.qty}
                </span>
              </Tooltip>
            ))}
          </div>
        )}
        {view.active ? (
          <Button type="default" onClick={() => run(stop)}>Cancel</Button>
        ) : locked ? (
          <Tag>Locked</Tag>
        ) : (
          <Button type="primary" disabled={short} onClick={start}>Start</Button>
        )}
      </div>
    </div>
  );
}
