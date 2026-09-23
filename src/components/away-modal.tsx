'use client';

import { Modal, Typography } from 'antd';
import { ITEMS } from '@/content/items';
import { MONSTERS } from '@/content/monsters';
import { SKILL_BY_ID } from '@/content/skills';
import type { SkillId } from '@/content/types';
import { fmt, span } from '@/lib/format';
import { useGame } from '@/store/game';
import Icon from './icon';

export default function AwayModal() {
  const away = useGame((s) => s.away);
  const dismiss = useGame((s) => s.dismissAway);
  if (!away) return null;
  const { summary, elapsed, simulated } = away;
  const gained = Object.entries(summary.gained).filter(([id]) => (summary.spent[id] ?? 0) < summary.gained[id]);
  const spent = Object.entries(summary.spent).filter(([id]) => !(id in summary.gained));

  return (
    <Modal open title="While you were away" onOk={dismiss} onCancel={dismiss} cancelButtonProps={{ style: { display: 'none' } }} okText="OK">
      <div className="flex flex-col gap-3">
        <Typography.Text type="secondary">
          {span(elapsed)}{simulated < elapsed ? ` · the first ${span(simulated)} counted (offline limit)` : ''}
        </Typography.Text>
        <div className="flex flex-col gap-2">
          {gained.map(([id, n]) => (
            <div key={id} className="flex flex-row items-center gap-2">
              <Icon imgPath={ITEMS[id].icon} alt="" />
              <span><b>+{fmt(n - (summary.spent[id] ?? 0))}</b> {ITEMS[id].name}</span>
            </div>
          ))}
          {spent.map(([id, n]) => (
            <div key={id} className="flex flex-row items-center gap-2 opacity-70">
              <Icon imgPath={ITEMS[id].icon} alt="" />
              <span>−{fmt(n)} {ITEMS[id].name}</span>
            </div>
          ))}
          {summary.gold > 0 && (
            <div className="flex flex-row items-center gap-2"><Icon imgPath="/icons/coin.png" alt="" /><span><b>+{fmt(summary.gold)}</b> gold</span></div>
          )}
          {(Object.entries(summary.xp) as [SkillId, number][]).map(([skill, xp]) => {
            const lv = summary.levels[skill];
            return (
              <div key={skill} className="flex flex-row items-center gap-2">
                <Icon imgPath={SKILL_BY_ID[skill].icon} alt="" />
                <span><b>+{fmt(xp)}</b> {SKILL_BY_ID[skill].name} XP{lv ? <Typography.Text type="success" strong> · level {lv.from} → {lv.to}</Typography.Text> : null}</span>
              </div>
            );
          })}
          {Object.entries(summary.kills).map(([id, n]) => (
            <div key={id} className="flex flex-row items-center gap-2"><Icon imgPath={MONSTERS[id].icon} alt="" /><span><b>{fmt(n)}</b> {MONSTERS[id].name} defeated</span></div>
          ))}
          {Object.entries(summary.eaten).map(([id, n]) => (
            <div key={id} className="flex flex-row items-center gap-2 opacity-70"><Icon imgPath={ITEMS[id].icon} alt="" /><span>Ate {fmt(n)} {ITEMS[id].name}</span></div>
          ))}
          {summary.defeats > 0 && <Typography.Text type="danger">Defeated {summary.defeats}×</Typography.Text>}
          {summary.stop && <Typography.Text type="warning">Stopped: {summary.stop}</Typography.Text>}
        </div>
      </div>
    </Modal>
  );
}
