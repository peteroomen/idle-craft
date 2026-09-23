'use client';

import { useMemo } from 'react';
import { App, Button, Descriptions, Empty, Tag, theme, Tooltip, Typography } from 'antd';
import { useShallow } from 'zustand/react/shallow';
import { EQUIP_SLOTS, ITEMS, type EquipSlot, type Item } from '@/content/items';
import { SKILL_BY_ID } from '@/content/skills';
import { cannotEquip, combatStats, equip, unequip } from '@/engine';
import { fmt, secs } from '@/lib/format';
import { useGame } from '@/store/game';
import { useEquipment, useInventory } from '@/store/hooks';
import Icon from './icon';

const SLOT_LABEL: Record<EquipSlot, string> = { weapon: 'Weapon', shield: 'Shield', helm: 'Helm', body: 'Body', legs: 'Legs', boots: 'Boots', ammo: 'Ammo' };
// A little paper doll: helm on top, weapon · body · shield, ammo · legs, boots.
const DOLL: (EquipSlot | null)[] = [null, 'helm', null, 'weapon', 'body', 'shield', 'ammo', 'legs', null, null, 'boots', null];

export function statLine(it: Item): string {
  const st = it.equip?.stats;
  if (!st) return '';
  const bits = [];
  if (st.accuracy) bits.push(`+${st.accuracy}% accuracy`);
  if (st.strength) bits.push(`+${st.strength}% strength`);
  if (st.rangedStrength) bits.push(`+${st.rangedStrength}% ranged strength`);
  if (st.armour) bits.push(`+${st.armour}% armour`);
  if (st.speed) bits.push(secs(st.speed));
  if (st.twoHanded) bits.push('two-handed');
  return bits.join(' · ');
}

export default function EquipmentView() {
  const { message } = App.useApp();
  const run = useGame((s) => s.run);
  const equipment = useEquipment();
  const inventory = useInventory();
  const stats = useGame(useShallow((s) => (s.game ? combatStats(s.game) : null)));
  const reasons = useGame(useShallow((s) => Object.fromEntries(Object.keys(s.game?.inventory ?? {}).filter((id) => ITEMS[id]?.equip).map((id) => [id, s.game ? cannotEquip(s.game, id) ?? '' : '']))));
  const { token: { colorBgContainer, borderRadiusLG, colorBorder, colorError } } = theme.useToken();

  const equippable = useMemo(() => Object.keys(inventory).map((id) => ITEMS[id]).filter((it) => it?.equip)
    .sort((a, b) => EQUIP_SLOTS.indexOf(a.equip!.slot) - EQUIP_SLOTS.indexOf(b.equip!.slot) || (b.tier ?? 0) - (a.tier ?? 0)), [inventory]);

  const act = (err: string | null, ok: string) => (err ? message.warning(err) : message.success(ok));

  return (
    <div className="flex flex-col gap-4">
      <Typography.Title level={3} style={{ margin: 0 }}>Equipment</Typography.Title>
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="grid grid-cols-3 gap-2 p-4" style={{ background: colorBgContainer, borderRadius: borderRadiusLG }}>
          {DOLL.map((slot, i) => {
            if (!slot) return <div key={i} className="size-20" />;
            const id = equipment[slot];
            const it = id ? ITEMS[id] : null;
            return (
              <Tooltip key={slot} title={it ? `${it.name} — click to take off` : SLOT_LABEL[slot]}>
                <button
                  className="size-20 flex flex-col items-center justify-center gap-1 cursor-pointer"
                  style={{ border: `1px dashed ${colorBorder}`, borderRadius: borderRadiusLG, background: 'transparent', color: 'inherit' }}
                  onClick={() => it && act(run(unequip, slot), `Took off ${it.name}`)}
                  aria-label={it ? `Unequip ${it.name}` : `${SLOT_LABEL[slot]} slot, empty`}
                >
                  {it ? <Icon imgPath={it.icon} size="lg" alt={it.name} /> : <span className="text-xs opacity-50">{SLOT_LABEL[slot]}</span>}
                  {slot === 'ammo' && it && <span className="text-[10px] -mt-2">{fmt(inventory[it.id] ?? 0)}</span>}
                </button>
              </Tooltip>
            );
          })}
        </div>
        {stats && (
          <div className="p-4 flex-1 w-full" style={{ background: colorBgContainer, borderRadius: borderRadiusLG }}>
            <Descriptions title="Combat stats" column={{ xs: 1, sm: 2 }} size="small" items={[
              { key: 'style', label: 'Style', children: stats.style === 'ranged' ? 'Ranged' : 'Melee' },
              { key: 'speed', label: 'Attack speed', children: secs(stats.speed) },
              { key: 'acc', label: 'Accuracy', children: `+${stats.accuracy}%` },
              { key: 'str', label: stats.style === 'ranged' ? 'Ranged strength' : 'Strength', children: `+${stats.strength}%` },
              { key: 'arm', label: 'Armour', children: `+${stats.armour}%` },
              { key: 'hp', label: 'Hitpoints', children: fmt(stats.maxHp) },
              { key: 'ar', label: 'Attack rating', children: fmt(stats.attackRating) },
              { key: 'mh', label: 'Max hit', children: fmt(stats.maxHit) },
              { key: 'dr', label: 'Defense rating', children: fmt(stats.defenseRating) },
              ...(stats.style === 'ranged' ? [{ key: 'ammo', label: 'Arrows', children: stats.ammo ? `${ITEMS[stats.ammo].name} ×${fmt(stats.ammoCount)}` : <span style={{ color: colorError }}>None — equip some arrows</span> }] : []),
            ]} />
          </div>
        )}
      </div>

      <Typography.Title level={4} style={{ margin: 0 }}>In your inventory</Typography.Title>
      {equippable.length === 0 ? <Empty description="Nothing to equip. Smith, fletch or buy some gear." /> : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {equippable.map((it) => {
            const why = reasons[it.id];
            return (
              <div key={it.id} className="flex flex-row items-center gap-3 p-3" style={{ background: colorBgContainer, borderRadius: borderRadiusLG }}>
                <Icon imgPath={it.icon} size="lg" alt="" />
                <div className="flex flex-col flex-1 min-w-0">
                  <b>{it.name}{it.equip!.slot === 'ammo' ? ` ×${fmt(inventory[it.id])}` : ''}</b>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>{statLine(it)}</Typography.Text>
                  <Tag color={why ? 'error' : 'default'} style={{ alignSelf: 'flex-start', marginTop: 4 }}>{SKILL_BY_ID[it.equip!.skill].name} {it.equip!.level}</Tag>
                </div>
                <Button type="primary" disabled={!!why} onClick={() => act(run(equip, it.id), `Equipped ${it.name}`)}>Equip</Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
