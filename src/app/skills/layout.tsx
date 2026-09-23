'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { theme } from 'antd';
import PageTitle from '@/components/page-title';
import SkillInfo from '@/components/skill-info';
import { skillByRoute } from '@/content/skills';

export default function SkillsLayout({ children }: React.PropsWithChildren) {
  const pathname = usePathname();
  const skill = skillByRoute(pathname.split('/').filter(Boolean).pop() ?? '');
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  if (!skill) return <>{children}</>;

  return (
    <div className="flex flex-col gap-4">
      <PageTitle icon={skill.icon} title={skill.name}>
        <SkillInfo level={1} />
      </PageTitle>
      <div className="flex flex-col p-4" style={{ backgroundColor: colorBgContainer, borderRadius: borderRadiusLG }}>
        {children}
      </div>
    </div>
  );
}
