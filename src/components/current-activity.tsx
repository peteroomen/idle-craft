import { PropsWithChildren, ReactNode } from "react";
import Icon from "./icon";
import Title from "antd/es/typography/Title";
import { Progress, theme } from "antd";

export default function CurrentActivity({description}: {description: string}) {

  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  
    return (
        <div className="flex flex-row items-center gap-2">
            <div>{description}</div>
            <Progress 
                type='circle'
                percent={parseFloat((569000/634000*100).toPrecision(2))} 
                size={48} 
            />
        </div>
    );
}