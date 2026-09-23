import { Tag, theme } from "antd";
import { PropsWithChildren } from "react";

export default function SkillInfo({level}: PropsWithChildren<{level: number}>) {

    const { token: { colorPrimary } } = theme.useToken();
    
    return (
        <div className="flex flex-row items-center">
            <div className="mr-1 font-bold">Level</div>
            <Tag color={colorPrimary}>{level} / 99</Tag>
            <div className="ml-2 mr-1 font-bold">XP</div>
            <Tag color="default">569,000 / 634,000</Tag>
        </div>
    );
}