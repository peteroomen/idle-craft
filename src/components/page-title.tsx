import { PropsWithChildren, ReactNode } from "react";
import Icon from "./icon";
import Title from "antd/es/typography/Title";
import { Progress, theme } from "antd";

export default function PageTitle({icon, title, endContent: content, children}: PropsWithChildren<{icon: string, title: string, endContent?: ReactNode}>) {

  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  
    return (
        <div className="flex flex-col" style={{backgroundColor: colorBgContainer, borderRadius: borderRadiusLG}}>
            <Progress 
                type='line'
                percent={parseFloat((569000/634000*100).toPrecision(4))} 
                showInfo={true} 
                percentPosition={{align: "center", type: "inner"}}
                size={{height: borderRadiusLG*2}} 
                style={{margin: 0, height: `${borderRadiusLG*2}px`, lineHeight: `${borderRadiusLG*2}px`}} 
            />
            <div className="flex flex-row gap-2 items-center p-4 pt-2">
                <Icon imgPath={icon} size="lg" />
                <Title level={3} style={{ margin: 0 }}>{title}</Title>
                <div className="ml-8">{children}</div>
                <div className="flex-grow"></div>
                {content}
            </div>
        </div>
    );
}