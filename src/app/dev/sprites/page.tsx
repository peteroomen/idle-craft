'use client';

import React, { useMemo, useState } from 'react';
import { Segmented, Tag, Typography } from 'antd';
import Icon from '@/components/icon';
import manifest from '@/content/sprite-manifest.json';

type Entry = { by: 'peter' | 'derived' | 'generated'; src: string };
const SPRITES = manifest as Record<string, Entry>;
const LABEL = { peter: 'Hand-drawn', derived: 'Derived', generated: 'Generated' } as const;
const COLOR = { peter: 'purple', derived: 'geekblue', generated: 'default' } as const;

// Every icon the game uses and where it came from. Replace any generated sprite by dropping
// a PNG into art/hand-drawn/overrides/ and running `npm run sprites`.
export default function SpriteGallery() {
  const [filter, setFilter] = useState<'all' | Entry['by']>('all');
  const groups = useMemo(() => {
    const out: Record<string, [string, Entry][]> = {};
    for (const [id, e] of Object.entries(SPRITES)) {
      if (filter !== 'all' && e.by !== filter) continue;
      (out[id.split(':')[0]] ??= []).push([id, e]);
    }
    return out;
  }, [filter]);
  const counts = Object.values(SPRITES).reduce<Record<string, number>>((a, e) => ((a[e.by] = (a[e.by] ?? 0) + 1), a), {});

  return (
    <div className="flex flex-col gap-4">
      <Typography.Title level={3} style={{ margin: 0 }}>Sprites</Typography.Title>
      <Segmented
        value={filter}
        onChange={(v) => setFilter(v as typeof filter)}
        options={[
          { label: `All (${Object.keys(SPRITES).length})`, value: 'all' },
          { label: `Hand-drawn (${counts.peter ?? 0})`, value: 'peter' },
          { label: `Derived (${counts.derived ?? 0})`, value: 'derived' },
          { label: `Generated (${counts.generated ?? 0})`, value: 'generated' },
        ]}
      />
      {Object.entries(groups).map(([kind, list]) => (
        <div key={kind} className="flex flex-col gap-2">
          <Typography.Text strong>{kind}</Typography.Text>
          <div className="flex flex-row flex-wrap gap-3">
            {list.map(([id, e]) => (
              <div key={id} className="flex flex-col items-center gap-1 w-24">
                <Icon imgPath={e.src} size="lg" />
                <span className="text-xs">{id}</span>
                <Tag color={COLOR[e.by]} style={{ marginInlineEnd: 0, fontSize: 10 }}>{LABEL[e.by]}</Tag>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
