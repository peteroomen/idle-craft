"use client"

import React, { useMemo } from 'react';
import {
    HeatMapOutlined,
    MailOutlined,
    PieChartOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import Icon from './icon';
import { usePathname, useRouter } from 'next/navigation'
import { fetchSkills } from "@/app/lib/fetchers";
import { Skill } from "@/app/models/skill";
import useSWR from "swr";

type MenuItem = Required<MenuProps>['items'][number];

export default function Nav() {

    const router = useRouter();
    const pathname = usePathname();
    const routeArray = pathname.split("/").splice(1);

    const { data, error } = useSWR<Skill[]>("skills", fetchSkills);


    const combatSkillItems = useMemo<MenuItem[]>(() => {
        if (!data) return [];
        return data.filter(skill => skill.isCombat).map(skill => ({
            key: skill.routeName, 
            icon: <Icon imgPath={skill.icon} />, 
            label: skill.name,
        }));
    }, [data]);

    const skillItems = useMemo<MenuItem[]>(() => {
        if (!data) return [];
        return data.filter(skill => !skill.isCombat).map(skill => ({
            key: skill.routeName, 
            icon: <Icon imgPath={skill.icon} />, 
            label: skill.name,
        }));
    }, [data]);

    const menuItems = useMemo<MenuItem[]>(() => {
        return [
            { key: 'status', icon: <PieChartOutlined />, label: 'Status' },
            { key: 'inventory', icon: <PieChartOutlined />, label: 'Inventory' },
            { key: 'equipment', icon: <PieChartOutlined />, label: 'Equipment' },
            { key: 'map', icon: <HeatMapOutlined />, label: 'World Map' },
            {
                key: 'combat',
                icon: <Icon imgPath='/icons/items/weapons/steel-sword.png' />,
                label: 'Combat',
                children: [
                    { key: 'encounters', label: 'Encounters' },
                    { key: 'dungeons', label: 'Dungeons' },
                    { key: 'tournaments', label: 'Tournaments' },
                ]
            },
            {
                key: 'skills',
                label: 'Skills',
                icon: <MailOutlined />,
                children: [
                    {
                      type: 'group',
                      label: 'Combat',
                      children: combatSkillItems
                    },
                    {
                      type: 'group',
                      label: 'Non-Combat',
                      children: skillItems
                    },
                ]
            },
        ];
    }, [skillItems]);

    return (
        <Menu
            mode="inline"
            defaultSelectedKeys={routeArray}
            defaultOpenKeys={['skills']}
            style={{ height: '100%' }}
            items={menuItems}
            onClick={({ keyPath }) => {
                router.push(`/${keyPath.reverse().join("/")}`)
            }}
        />
    );
};