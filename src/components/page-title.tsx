import { PropsWithChildren, ReactNode } from 'react';
import Icon from './icon';
import Title from 'antd/es/typography/Title';
import { Progress, theme } from 'antd';

// Peter's skill header: an XP bar across the top, icon, title, info, and something on the right.
export default function PageTitle({ icon, title, percent, endContent, children }: PropsWithChildren<{ icon: string; title: string; percent?: number; endContent?: ReactNode }>) {
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  return (
    <div className="flex flex-col overflow-hidden" style={{ backgroundColor: colorBgContainer, borderRadius: borderRadiusLG }}>
      {percent !== undefined && (
        <Progress
          type="line"
          percent={Number(percent.toFixed(1))}
          showInfo={true}
          percentPosition={{ align: 'center', type: 'inner' }}
          size={{ height: borderRadiusLG * 2 }}
          style={{ margin: 0, height: `${borderRadiusLG * 2}px`, lineHeight: `${borderRadiusLG * 2}px` }}
        />
      )}
      <div className="flex flex-row flex-wrap gap-x-4 gap-y-2 items-center p-4 pt-2">
        <Icon imgPath={icon} size="lg" />
        <Title level={3} style={{ margin: 0 }}>{title}</Title>
        <div className="sm:ml-4">{children}</div>
        <div className="flex-grow"></div>
        {endContent}
      </div>
    </div>
  );
}
