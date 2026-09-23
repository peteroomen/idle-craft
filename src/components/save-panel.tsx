'use client';

import { useState } from 'react';
import { App, Button, Input, Popconfirm, Space, theme, Typography } from 'antd';
import { exportSave, importSave, newGame } from '@/engine';
import { useGame } from '@/store/game';

export default function SavePanel() {
  const { message } = App.useApp();
  const replace = useGame((s) => s.replace);
  const [text, setText] = useState('');
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const doExport = async () => {
    const game = useGame.getState().game;
    if (!game) return;
    const code = exportSave(game);
    setText(code);
    try {
      await navigator.clipboard.writeText(code);
      message.success('Save copied to the clipboard');
    } catch {
      message.info('Save shown below — copy it from the box');
    }
  };

  const doImport = () => {
    const s = importSave(text);
    if (!s) { message.error("That doesn't look like an Ironbark save"); return; }
    replace(s);
    message.success('Save loaded');
  };

  return (
    <div className="flex flex-col gap-2 p-4" style={{ background: colorBgContainer, borderRadius: borderRadiusLG }}>
      <Typography.Title level={5} style={{ margin: 0 }}>Save</Typography.Title>
      <Typography.Text type="secondary">Your game saves in this browser every 10 seconds. Export a copy to move it to another device.</Typography.Text>
      <Input.TextArea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Paste a save here to import it" aria-label="Save code" />
      <Space wrap>
        <Button onClick={doExport}>Export</Button>
        <Popconfirm title="Replace your current game?" okText="Import" onConfirm={doImport} disabled={!text.trim()}>
          <Button disabled={!text.trim()}>Import</Button>
        </Popconfirm>
        <Popconfirm title="Start a new game?" description="This deletes your save." okText="Reset" okButtonProps={{ danger: true }} onConfirm={() => { replace(newGame(Date.now())); message.success('New game started'); }}>
          <Button danger>Reset</Button>
        </Popconfirm>
      </Space>
    </div>
  );
}
