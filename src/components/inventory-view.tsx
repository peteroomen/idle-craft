'use client';

import { useMemo, useState } from 'react';
import { App, Badge, Button, Descriptions, Empty, InputNumber, Segmented, Tag, theme, Typography } from 'antd';
import { ITEMS, type Item, type ItemCategory } from '@/content/items';
import { SKILL_BY_ID } from '@/content/skills';
import { cannotEquip, equip, sell } from '@/engine';
import { compact, fmt } from '@/lib/format';
import { useGame } from '@/store/game';
import { useInventory, useSlots } from '@/store/hooks';
import Icon from './icon';

const CATEGORY_ORDER: ItemCategory[] = ['log', 'ore', 'bar', 'fish', 'weapon', 'armour', 'tool', 'ammo', 'material'];
const CATEGORY_LABEL: Record<ItemCategory, string> = { log: 'Logs', ore: 'Ores', bar: 'Bars', fish: 'Fish', weapon: 'Weapons', armour: 'Armour', tool: 'Tools', ammo: 'Ammo', material: 'Materials' };

export default function InventoryView() {
  const inventory = useInventory();
  const { used, cap } = useSlots();
  const [filter, setFilter] = useState<'all' | ItemCategory>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const { token: { colorBgContainer, borderRadiusLG, colorPrimary, colorFillTertiary } } = theme.useToken();

  const items = useMemo(() => Object.keys(inventory).map((id) => ITEMS[id]).filter(Boolean)
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || (a.tier ?? 0) - (b.tier ?? 0) || a.name.localeCompare(b.name)), [inventory]);
  const present = CATEGORY_ORDER.filter((c) => items.some((i) => i.category === c));
  const shown = filter === 'all' ? items : items.filter((i) => i.category === filter);
  const worth = items.reduce((t, i) => t + i.value * (inventory[i.id] ?? 0), 0);
  const sel = selected && inventory[selected] ? ITEMS[selected] : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row flex-wrap items-center gap-3">
        <Typography.Title level={3} style={{ margin: 0 }}>Inventory</Typography.Title>
        <Tag color={used >= cap ? 'error' : 'default'}>{used} / {cap} slots</Tag>
        <Tag>Worth {fmt(worth)} gold</Tag>
      </div>
      {present.length > 1 && (
        <div className="overflow-x-auto">
          <Segmented value={filter} onChange={(v) => setFilter(v as typeof filter)} options={[{ label: 'All', value: 'all' }, ...present.map((c) => ({ label: CATEGORY_LABEL[c], value: c }))]} />
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="grid gap-2 flex-1 w-full" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}>
          {shown.length === 0 && <Empty description="Nothing here yet" />}
          {shown.map((it) => (
            <button
              key={it.id}
              onClick={() => setSelected(it.id)}
              title={it.name}
              className="flex items-center justify-center p-2 cursor-pointer"
              style={{ background: colorBgContainer, borderRadius: borderRadiusLG, outline: selected === it.id ? `2px solid ${colorPrimary}` : 'none', aspectRatio: '1', border: 0 }}
            >
              <Badge count={compact(inventory[it.id])} offset={[-2, 46]} color={colorFillTertiary} style={{ color: 'inherit', boxShadow: 'none' }}>
                <Icon imgPath={it.icon} size="lg" alt={it.name} />
              </Badge>
            </button>
          ))}
        </div>
        {sel && <ItemPanel item={sel} qty={inventory[sel.id]} />}
      </div>
    </div>
  );
}

function ItemPanel({ item, qty }: { item: Item; qty: number }) {
  const { message } = App.useApp();
  const run = useGame((s) => s.run);
  const [n, setN] = useState<number | null>(1);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const why = useGame((s) => (s.game && item.equip ? cannotEquip(s.game, item.id) : null));
  const doEquip = () => {
    const err = run(equip, item.id);
    if (err) message.warning(err);
    else message.success(`Equipped ${item.name}`);
  };

  const doSell = (count: number) => {
    const err = run(sell, item.id, count);
    if (err) message.warning(err);
    else message.success(`Sold ${fmt(count)} ${item.name} for ${fmt(item.value * count)} gold`);
  };

  return (
    <div className="flex flex-col gap-3 p-4 w-full lg:w-80" style={{ background: colorBgContainer, borderRadius: borderRadiusLG }}>
      <div className="flex flex-row items-center gap-3">
        <Icon imgPath={item.icon} size="lg" alt="" />
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>{item.name}</Typography.Title>
          <Typography.Text type="secondary">{fmt(qty)} owned</Typography.Text>
        </div>
      </div>
      <Descriptions column={1} size="small" items={[
        { key: 'v', label: 'Sells for', children: `${item.value < 1 ? item.value.toFixed(2) : fmt(item.value)} gold each` },
        ...(item.heals ? [{ key: 'h', label: 'Heals', children: `${item.heals} HP` }] : []),
        ...(item.tool ? [{ key: 't', label: 'Tool', children: `${Math.round((1 - item.tool.speed) * 100)}% faster ${SKILL_BY_ID[item.tool.skill].name} · needs level ${item.tool.level}` }] : []),
        ...(item.equip ? [{ key: 'e', label: 'Equip', children: `${item.equip.slot} · needs ${SKILL_BY_ID[item.equip.skill].name} ${item.equip.level}` }] : []),
      ]} />
      {item.equip && (
        <Button type="primary" disabled={!!why} onClick={doEquip}>{why ?? 'Equip'}</Button>
      )}
      <div className="flex flex-row gap-2">
        <InputNumber min={1} max={qty} value={n} onChange={setN} style={{ width: 110 }} aria-label="Quantity" />
        <Button onClick={() => doSell(Math.min(n ?? 1, qty))}>Sell</Button>
        <Button danger onClick={() => doSell(qty)}>Sell all</Button>
      </div>
    </div>
  );
}
