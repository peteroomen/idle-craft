"use client"

import React, { PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import { Breadcrumb, Layout, Switch, theme } from 'antd';
import Title from './title';
import Nav from './nav';
import { usePathname } from 'next/navigation';
import { capitalizeFirstLetter, localStorageKeys } from '../lib/utils';
const { Header, Sider, Content } = Layout;

export default function MainLayout({ children, darkMode, onToggleDarkMode }: PropsWithChildren<{ darkMode: boolean, onToggleDarkMode: () => void }>) {

    const pathname = usePathname();
    const breadcrumbItems = pathname.split("/").slice(1).map(p => ({ title: capitalizeFirstLetter(p) }));
    const { token: { colorPrimary } } = theme.useToken();


    return (
        <Layout style={{ width: "100vw", height: "100vh" }}>
            <Header>
                <div className="h-16 flex items-center gap-2">
                    <Title />
                    <div className='flex-grow'></div>
                    <div className='text-white'>Dark Mode</div>
                    <Switch checked={darkMode} style={{backgroundColor: darkMode ? colorPrimary : "rgba(255,255,255,.2)"}} onChange={() => onToggleDarkMode()} />
                </div>
            </Header>
            <Layout>
                <Sider width={320} style={{ overflow: "auto" }}>
                    <Nav />
                </Sider>

                <Layout style={{ padding: '0 24px 24px' }}>
                    <Breadcrumb
                        items={breadcrumbItems}
                        style={{ margin: '16px 0' }}
                    />
                    <Content
                        style={{
                            margin: 0,
                            minHeight: 280,
                        }}
                    >
                        {children}
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    );
};