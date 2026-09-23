'use client';

import { useState } from 'react';
import Link from 'next/link';
import { App, Button, InputNumber, Popconfirm, Select, Space, Typography, theme } from 'antd';
import { XP_TABLE } from '@/content/formulas';
import { ITEM_LIST } from '@/content/items';
import { SKILLS } from '@/content/skills';
import type { SkillId } from '@/content/types';
import { give, ignore, newGame, type GameState } from '@/engine';
import { useGame } from '@/store/game';

const setLevel = (s: GameState, skill: SkillId, lvl: number) => { s.xp[skill] = XP_TABLE[Math.max(1, Math.min(99, lvl))]; return null; };
const giveItem = (s: GameState, item: string, qty: number) => (give(s, item, qty, ignore) ? null : 'Inventory full');
const giveGold = (s: GameState, n: number) => { s.gold += n; return null; };

/** Testing without waiting. Not linked from the menu; open /dev/. */
export default function DevTools() {
  const { message } = App.useApp();
  const run = useGame((s) => s.run);
  const warp = useGame((s) => s.warp);
  const replace = useGame((s) => s.replace);
  const [skill, setSkill] = useState<SkillId>('woodcutting');
  const [lvl, setLvl] = useState<number | null>(50);
  const [item, setItem] = useState<string>('copper_ore');
  const [qty, setQty] = useState<number | null>(100);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const box = { background: colorBgContainer, borderRadius: borderRadiusLG, padding: 16 };
  const ok = (err: string | null, text: string) => (err ? message.warning(err) : message.success(text));

  return (
    <div className="flex flex-col gap-4">
      <Typography.Title level={3} style={{ margin: 0 }}>Dev tools</Typography.Title>
      <Typography.Text type="secondary">For testing. Everything here edits your save. <Link href="/dev/sprites/">Sprite gallery</Link></Typography.Text>
      <div style={box} className="flex flex-col gap-2">
        <b>Time warp</b>
        <Space wrap>
          {[['10 min', 600_000], ['1 hour', 3_600_000], ['8 hours', 28_800_000], ['24 hours', 86_400_000]].map(([label, ms]) => (
            <Button key={label} onClick={() => warp(ms as number)}>+{label}</Button>
          ))}
        </Space>
      </div>
      <div style={box} className="flex flex-col gap-2">
        <b>Set level</b>
        <Space wrap>
          <Select value={skill} onChange={setSkill} style={{ width: 160 }} options={SKILLS.map((s) => ({ value: s.id, label: s.name }))} aria-label="Skill" />
          <InputNumber min={1} max={99} value={lvl} onChange={setLvl} aria-label="Level" />
          <Button onClick={() => ok(run(setLevel, skill, lvl ?? 1), `${skill} set to ${lvl}`)}>Set</Button>
          <Button onClick={() => { for (const s of SKILLS) run(setLevel, s.id, lvl ?? 1); message.success(`All skills set to ${lvl}`); }}>Set all</Button>
        </Space>
      </div>
      <div style={box} className="flex flex-col gap-2">
        <b>Give</b>
        <Space wrap>
          <Select showSearch value={item} onChange={setItem} style={{ width: 240 }} optionFilterProp="label" options={ITEM_LIST.map((i) => ({ value: i.id, label: i.name }))} aria-label="Item" />
          <InputNumber min={1} value={qty} onChange={setQty} aria-label="Quantity" />
          <Button onClick={() => ok(run(giveItem, item, qty ?? 1), `Gave ${qty} ${item}`)}>Give item</Button>
          <Button onClick={() => ok(run(giveGold, 100_000), 'Gave 100,000 gold')}>+100,000 gold</Button>
        </Space>
      </div>
      <div style={box} className="flex flex-col gap-2">
        <b>Reset</b>
        <Popconfirm title="Start a new game?" description="This deletes your save." okText="Reset" okButtonProps={{ danger: true }} onConfirm={() => { replace(newGame(Date.now())); message.success('New game started'); }}>
          <Button danger style={{ alignSelf: 'flex-start' }}>Reset save</Button>
        </Popconfirm>
      </div>
    </div>
  );
}
