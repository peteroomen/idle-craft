'use client';

import '@ant-design/v5-patch-for-react-19';
import '@fontsource/silkscreen/700.css';
import React, { useEffect, useState } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App, ConfigProvider, theme, ThemeConfig } from 'antd';
import MainLayout from '@/components/main-layout';
import GameClock from '@/components/game-clock';
import { localStorageKeys } from '@/lib/utils';

// Peter's next-idle theme: purple primary, deep purple header, instant progress bars.
const shared: ThemeConfig['components'] = {
  Layout: { headerBg: 'rgb(19,0,41)' },
  Progress: { motionDurationSlow: '0' },
};
const darkTheme: ThemeConfig = { token: { colorPrimary: '#c67ae6', colorInfo: '#c67ae6' }, components: shared, algorithm: theme.darkAlgorithm };
const lightTheme: ThemeConfig = {
  token: { colorPrimary: '#722ed1', colorInfo: '#722ed1' },
  components: { ...shared, Progress: { motionDurationSlow: '0', remainingColor: 'rgba(0,0,0,0.10)' } },
  algorithm: theme.defaultAlgorithm,
};

export default function Providers({ children }: React.PropsWithChildren) {
  const [darkMode, setDarkMode] = useState<boolean>();

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(localStorageKeys.DARK_MODE); } catch { /* storage blocked */ }
    setDarkMode(stored === null ? true : stored === 'true');
  }, []);

  function toggleDarkMode() {
    const value = !darkMode;
    try { localStorage.setItem(localStorageKeys.DARK_MODE, value.toString()); } catch { /* storage blocked */ }
    setDarkMode(value);
  }

  if (darkMode === undefined) return null;

  return (
    <AntdRegistry>
      <ConfigProvider theme={darkMode ? darkTheme : lightTheme}>
        <App>
          <GameClock />
          <MainLayout darkMode={darkMode} onToggleDarkMode={toggleDarkMode}>
            {children}
          </MainLayout>
        </App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
