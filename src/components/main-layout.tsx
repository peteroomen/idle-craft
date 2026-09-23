'use client';

import React, { PropsWithChildren, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Breadcrumb, Button, Drawer, Grid, Layout, Switch, theme } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import Title from './title';
import Nav from './nav';
import CurrentActivity from './current-activity';
import Gold from './gold';
import Icon from './icon';
import Loading from './loading';
import { capitalizeFirstLetter } from '@/lib/utils';
import { useReady } from '@/store/hooks';

const { Header, Sider, Content } = Layout;
const HEADER = 64;

const TABS = [
  { href: '/combat/encounters/', icon: '/icons/sword-3.png', label: 'Combat' },
  { href: '/inventory/', icon: '/icons/bar-1.png', label: 'Inventory' },
  { href: '/equipment/', icon: '/icons/helm-5.png', label: 'Equipment' },
  { href: '/shop/', icon: '/icons/coin.png', label: 'Shop' },
];

// Peter's next-idle layout: purple header, menu in a sider, breadcrumb, content.
// Below the lg breakpoint the sider becomes a drawer and a tab bar sits under your thumb.
export default function MainLayout({ children, darkMode, onToggleDarkMode }: PropsWithChildren<{ darkMode: boolean; onToggleDarkMode: () => void }>) {
  const pathname = usePathname();
  const ready = useReady();
  const screens = Grid.useBreakpoint();
  const mobile = screens.lg === false;
  const [drawer, setDrawer] = useState(false);
  const breadcrumbItems = pathname.split('/').filter(Boolean).map((p) => ({ title: capitalizeFirstLetter(p) }));
  const { token: { colorPrimary, colorBgContainer, colorBorderSecondary, colorTextSecondary } } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100dvh' }}>
      <Header style={{ position: 'sticky', top: 0, zIndex: 20, paddingInline: mobile ? 12 : 24, paddingTop: 'env(safe-area-inset-top, 0px)', height: 'auto', lineHeight: 'normal' }}>
        <div className="flex items-center gap-3" style={{ height: HEADER }}>
          {mobile && <Button type="text" aria-label="Menu" icon={<MenuOutlined style={{ color: '#fff' }} />} onClick={() => setDrawer(true)} />}
          <Link href="/" aria-label="Ironbark home"><Title /></Link>
          <div className="flex-grow" />
          {!mobile && <div className="text-white"><CurrentActivity /></div>}
          <Gold />
          {!mobile && <div className="text-white">Dark Mode</div>}
          <Switch aria-label="Dark mode" checked={darkMode} style={{ backgroundColor: darkMode ? colorPrimary : 'rgba(255,255,255,.2)' }} onChange={() => onToggleDarkMode()} />
        </div>
      </Header>
      <Layout>
        {!mobile && (
          <Sider width={280} style={{ overflow: 'auto', height: `calc(100dvh - ${HEADER}px)`, position: 'sticky', top: HEADER }}>
            <Nav />
          </Sider>
        )}
        <Layout style={{ padding: mobile ? '0 12px 12px' : '0 24px 24px', paddingBottom: mobile ? 132 : 24 }}>
          <Breadcrumb items={breadcrumbItems} style={{ margin: '16px 0' }} />
          <Content style={{ margin: 0, minHeight: 280 }}>{ready ? children : <Loading />}</Content>
        </Layout>
      </Layout>
      {mobile && (
        <div className="fixed left-0 right-0 bottom-0 z-20" style={{ background: colorBgContainer, borderTop: `1px solid ${colorBorderSecondary}`, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="px-3 py-2" style={{ borderBottom: `1px solid ${colorBorderSecondary}` }}><CurrentActivity /></div>
          <nav className="grid grid-cols-5" aria-label="Main">
            <button className="flex flex-col items-center py-1 text-[11px]" style={{ color: colorTextSecondary }} onClick={() => setDrawer(true)}>
              <Icon imgPath="/icons/skill-woodcutting.png" alt="" />Skills
            </button>
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} className="flex flex-col items-center py-1 text-[11px]" style={{ color: pathname.startsWith(t.href.slice(0, -1)) ? colorPrimary : colorTextSecondary }}>
                <Icon imgPath={t.icon} alt="" />{t.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
      <Drawer open={drawer} placement="left" width={290} onClose={() => setDrawer(false)} styles={{ body: { padding: 0 } }} title="Ironbark">
        <Nav onNavigate={() => setDrawer(false)} />
      </Drawer>
    </Layout>
  );
}
