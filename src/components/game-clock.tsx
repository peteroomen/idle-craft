'use client';

import { useEffect } from 'react';
import { App } from 'antd';
import { ITEMS } from '@/content/items';
import { SKILL_BY_ID } from '@/content/skills';
import { useGame } from '@/store/game';
import AwayModal from './away-modal';
import Icon from './icon';

const TICK_MS = 100;
const AUTOSAVE_MS = 10_000;

/** Runs the game: loads the save, ticks the engine, autosaves, and turns events into toasts. */
export default function GameClock() {
  const { message, notification } = App.useApp();
  const tickId = useGame((s) => s.tickId);

  useEffect(() => {
    const store = useGame.getState();
    store.load(Date.now());
    const tick = setInterval(() => useGame.getState().tick(Date.now()), TICK_MS);
    const save = setInterval(() => useGame.getState().save(), AUTOSAVE_MS);
    const onVisibility = () => useGame.getState().setHidden(document.hidden, Date.now());
    const onLeave = () => useGame.getState().save();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onLeave);
    return () => {
      clearInterval(tick);
      clearInterval(save);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onLeave);
      onLeave();
    };
  }, []);

  // Peter's toast: the item icon, "+1", and the new total. One toast per item, updated in place.
  useEffect(() => {
    const { events, game } = useGame.getState();
    for (const e of events) {
      if (e.type === 'gain' && game) {
        const it = ITEMS[e.item];
        message.open({
          key: `gain-${e.item}`,
          icon: <Icon imgPath={it.icon} className="mr-2" alt={it.name} />,
          content: <span className="flex flex-row gap-2"><span className="font-bold">+{e.qty}</span>({(game.inventory[e.item] ?? 0).toLocaleString()})</span>,
          duration: 2,
        });
      } else if (e.type === 'level') {
        const sk = SKILL_BY_ID[e.skill];
        notification.success({ key: `level-${e.skill}`, message: `${sk.name} level ${e.level}`, icon: <Icon imgPath={sk.icon} alt={sk.name} />, placement: 'bottomRight', duration: 4 });
      } else if (e.type === 'stop') {
        message.warning({ key: 'stop', content: e.reason });
      } else if (e.type === 'defeat') {
        message.error({ key: 'defeat', content: 'You were defeated and retreated to rest.' });
      }
    }
  }, [tickId, message, notification]);

  return <AwayModal />;
}
