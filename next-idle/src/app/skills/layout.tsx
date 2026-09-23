"use client"

import React, { useState } from 'react';
import { fetchSkillByRoute } from "@/app/lib/fetchers";
import { Skill } from "@/app/models/skill";
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import PageTitle from '../components/page-title';
import Loading from '../components/loading';
import SkillInfo from '../components/skill-info';
import { Progress, theme } from 'antd';
import CurrentActivity from '../components/current-activity';
import Activity from '../components/activity';

export default function SkillsLayout({ children }: React.PropsWithChildren) {

  const pathname = usePathname();
  const skillRoute = pathname.split("/").pop();
  const { data } = useSWR<Skill>(skillRoute, fetchSkillByRoute);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const [activeActivity, setActive] = useState<string | undefined>(undefined)

  const handleActivityToggle = (activityId: string, state: boolean) => {
    if (state) {
      setActive(activityId);
    } else {
      setActive(undefined);
    }
  }

  if (!data) return <Loading />

  return (
    <div className='flex flex-col gap-4'>
      <PageTitle icon={data.icon} title={data.name} endContent={<CurrentActivity description='Cutting yew logs' />}>
        <SkillInfo level={69} />
      </PageTitle>
      <div className='flex flex-row flex-wrap gap-4'>
        {data.activities.map(activity => 
            <Activity key={activity.name} activity={activity} isActive={activeActivity == activity._id} handleToggle={(state) => handleActivityToggle(activity._id, state)} />
        )}
      </div>
      <div className='flex flex-col p-4' style={{ backgroundColor: colorBgContainer, borderRadius: borderRadiusLG }}>
        {children}
      </div>
    </div>
  );
}