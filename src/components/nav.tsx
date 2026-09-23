'use client';

import React, { useMemo } from 'react';
import { HeatMapOutlined, PieChartOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import Icon from './icon';
import { usePathname, useRouter } from 'next/navigation';
import { SKILLS } from '@/content/skills';

type MenuItem = Required<MenuProps>['items'][number];

// Peter's next-idle menu. Skills now come from content files instead of MongoDB.
export default function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const routeArray = pathname.split('/').filter(Boolean);

  const menuItems = useMemo<MenuItem[]>(() => {
    const skillItem = (combat: boolean) =>
      SKILLS.filter((s) => s.isCombat === combat).map((skill) => ({
        key: skill.routeName,
        icon: <Icon imgPath={skill.icon} />,
        label: skill.name,
      }));
    return [
      { key: 'status', icon: <PieChartOutlined />, label: 'Status' },
      { key: 'inventory', icon: <Icon imgPath="/icons/bar-1.png" />, label: 'Inventory' },
      { key: 'equipment', icon: <Icon imgPath="/icons/helm-5.png" />, label: 'Equipment' },
      { key: 'shop', icon: <Icon imgPath="/icons/coin.png" />, label: 'Shop' },
      { key: 'map', icon: <HeatMapOutlined />, label: 'World Map', disabled: true },
      {
        key: 'combat',
        icon: <Icon imgPath="/icons/sword-3.png" />,
        label: 'Combat',
        children: [
          { key: 'encounters', label: 'Encounters' },
          { key: 'dungeons', label: 'Dungeons', disabled: true },
          { key: 'tournaments', label: 'Tournaments', disabled: true },
        ],
      },
      {
        key: 'skills',
        label: 'Skills',
        icon: <Icon imgPath="/icons/skill-woodcutting.png" />,
        children: [
          { type: 'group', label: 'Combat', children: skillItem(true) },
          { type: 'group', label: 'Non-Combat', children: skillItem(false) },
        ],
      },
    ];
  }, []);

  return (
    <Menu
      mode="inline"
      selectedKeys={routeArray}
      defaultOpenKeys={['skills', 'combat']}
      style={{ height: '100%', borderInlineEnd: 0 }}
      items={menuItems}
      onClick={({ keyPath }) => {
        router.push(`/${[...keyPath].reverse().join('/')}/`);
        onNavigate?.();
      }}
    />
  );
}
