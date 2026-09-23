import { PropsWithChildren, ReactNode, useEffect, useState } from "react";
import Icon from "./icon";
import Title from "antd/es/typography/Title";
import { Button, message, Progress, theme } from "antd";
import type { Activity as IActivity } from '@/content/types';

export default function Activity({activity, isActive, handleToggle}: {activity: IActivity, isActive: boolean, handleToggle: (state: boolean) => void}) {

    const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

    const [percentage, setPercentage] = useState(0);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout>();

    const [messageApi, contextHolder] = message.useMessage();

    //TEMP
    const [itemCount, setItemCount] = useState(0);

    useEffect(() => {
        if (isActive) {
            console.log("Active toggled to true");
            setPercentage(0);
            if (intervalId) {
                clearInterval(intervalId);
            }
            const interval = setInterval(() => {
                console.log("Interval triggered");
                setPercentage(percentage => percentage+1);
            }, activity.duration / 100);
            setIntervalId(interval);
        } else {
            if (intervalId) {
                clearInterval(intervalId);
            }
            setPercentage(0);
            setIntervalId(undefined);
            setItemCount(itemCount => itemCount++)
        }
    }, [isActive]);

    useEffect(() => {
        // If at 100%, then reset the percentage, and resolve the activity
        if (percentage >= 100) {
            console.log("Reached/exceeded 100%, incrementing item count");
            setItemCount(count => count+1);
            setPercentage(0);
            messageApi.open({
                icon: <Icon imgPath={activity.icon} />, 
                content: <span className="flex flex-row gap-2"><span className="font-bold">+1</span>({itemCount+1})</span>
            });
        }
    }, [percentage]);
  
    return (<>
        {contextHolder}
        <div className='flex flex-col w-52' style={{ backgroundColor: colorBgContainer, borderRadius: borderRadiusLG }}>
        {isActive && <Progress 
            type='line'
            percent={percentage} 
            showInfo={false} 
            size={{height: borderRadiusLG}} 
            style={{margin: 0, height: `${borderRadiusLG}px`, lineHeight: `${borderRadiusLG}px`, transition: "none"}} 
        />}
        <div className={`flex flex-col items-center gap-2 p-4 ${isActive ? "pt-2" : ""}`}>
            <div className="flex flex-col items-center">
                <div className="text-xs">{activity.action}</div>
                <div className="font-bold">{activity.name}</div>
                <div className="text-xs">{activity.xp} XP / {activity.duration/1000} sec</div>
            </div>
            <Icon imgPath={activity.icon} size="lg" />
            {isActive && <>
                <Button type="default" onClick={() => handleToggle(false)}>Cancel</Button>
            </>}
            {!isActive && <>
                <Button type="primary" onClick={() => handleToggle(true)}>Start</Button>
            </>}
        </div>
        </div>
    </>);
}