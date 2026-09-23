'use client';

import { useState } from 'react';
import { App, Button, InputNumber, Segmented, Tag, theme, Typography } from 'antd';
import { ITEMS } from '@/content/items';
import { LISTINGS, SHOP_SECTIONS, nextUpgrade, type Listing, type ShopSection } from '@/content/shop';
import { SKILL_BY_ID } from '@/content/skills';
import { buy } from '@/engine';
import { fmt } from '@/lib/format';
import { useGame } from '@/store/game';
import { useCount, useGold } from '@/store/hooks';
import Gold from './gold';
import Icon from './icon';

export default function ShopView() {
  const [section, setSection] = useState<ShopSection>('Tools');
  const shown = LISTINGS.filter((l) => l.section === section);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row flex-wrap items-center gap-3">
        <Typography.Title level={3} style={{ margin: 0 }}>Shop</Typography.Title>
        <Gold />
      </div>
      <Typography.Text type="secondary">Tiers 1–5 are for sale. Tiers 6–8 have to be crafted.</Typography.Text>
      <div className="overflow-x-auto">
        <Segmented value={section} onChange={(v) => setSection(v as ShopSection)} options={SHOP_SECTIONS} />
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
        {shown.map((l) => (l.kind === 'item' ? <ItemListing key={l.id} listing={l} /> : <UpgradeListing key={l.id} listing={l} />))}
      </div>
    </div>
  );
}

function Card({ children }: React.PropsWithChildren) {
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  return <div className="flex flex-col gap-2 p-3" style={{ background: colorBgContainer, borderRadius: borderRadiusLG }}>{children}</div>;
}

function Price({ gold }: { gold: number }) {
  return <span className="flex flex-row items-center gap-1 font-bold" style={{ color: '#f2c94c' }}><Icon imgPath="/icons/coin.png" alt="" />{fmt(gold)}</span>;
}

function ItemListing({ listing }: { listing: Extract<Listing, { kind: 'item' }> }) {
  const { message } = App.useApp();
  const run = useGame((s) => s.run);
  const gold = useGold();
  const owned = useCount(listing.item);
  const [qty, setQty] = useState<number | null>(listing.bulk ? 100 : 1);
  const it = ITEMS[listing.item];
  const n = qty ?? 1;
  const need = it.tool ? `Use: ${SKILL_BY_ID[it.tool.skill].name} ${it.tool.level}` : it.equip ? `${it.equip.slot === 'ammo' ? 'Fire' : it.equip.slot === 'weapon' ? 'Wield' : 'Wear'}: ${SKILL_BY_ID[it.equip.skill].name} ${it.equip.level}` : it.heals ? `Heals ${it.heals}` : null;

  const doBuy = () => {
    const err = run(buy, listing.id, n);
    if (err) message.warning(err);
    else message.success(`Bought ${fmt(n)} ${it.name}`);
  };

  return (
    <Card>
      <div className="flex flex-row items-center gap-3">
        <Icon imgPath={it.icon} size="lg" alt="" />
        <div className="flex flex-col min-w-0">
          <b>{it.name}</b>
          {need && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{need}</Typography.Text>}
          {owned > 0 && <Typography.Text type="secondary" style={{ fontSize: 12 }}>Owned: {fmt(owned)}</Typography.Text>}
        </div>
      </div>
      <div className="flex flex-row items-center gap-2">
        <Price gold={listing.price * n} />
        <div className="flex-grow" />
        {listing.bulk && <InputNumber min={1} max={100000} value={qty} onChange={setQty} style={{ width: 90 }} aria-label={`Quantity of ${it.name}`} />}
        <Button type="primary" disabled={gold < listing.price * n} onClick={doBuy}>Buy</Button>
      </div>
    </Card>
  );
}

function UpgradeListing({ listing }: { listing: Extract<Listing, { kind: 'upgrade' }> }) {
  const { message } = App.useApp();
  const run = useGame((s) => s.run);
  const gold = useGold();
  const owned = useGame((s) => s.game?.upgrades[listing.upgrade] ?? 0);
  const next = nextUpgrade(listing.upgrade, owned);
  return (
    <Card>
      {next ? (
        <>
          <b>{next.title}</b>
          <Typography.Text type="secondary">{next.detail}</Typography.Text>
          <div className="flex flex-row items-center gap-2">
            <Price gold={next.price} />
            <div className="flex-grow" />
            <Button type="primary" disabled={gold < next.price} onClick={() => { const err = run(buy, listing.id, 1); if (err) message.warning(err); else message.success(`${next.title} bought`); }}>Buy</Button>
          </div>
        </>
      ) : (
        <>
          <b>{listing.upgrade === 'autoEat' ? 'Auto-eat III' : 'Offline time 24 h'}</b>
          <Tag color="success" style={{ alignSelf: 'flex-start' }}>Maxed</Tag>
        </>
      )}
    </Card>
  );
}
