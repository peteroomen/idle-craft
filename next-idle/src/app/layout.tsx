"use client"

import '@ant-design/v5-patch-for-react-19';
import React, { useState, useEffect } from 'react';
import "./globals.css";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, theme, ThemeConfig } from "antd";
import MainLayout from "./components/main-layout";
import { localStorageKeys } from './lib/utils';

export default function RootLayout({ children }: React.PropsWithChildren) {

    const [darkMode, setDarkMode] = useState<boolean>();
    const loadDarkModeFromLocalStorage = () => setDarkMode(localStorage.getItem(localStorageKeys.DARK_MODE) === "true");
    useEffect(() => {
      loadDarkModeFromLocalStorage();
    }, [])
    function toggleDarkMode() {
        let value = !darkMode;
        localStorage.setItem(localStorageKeys.DARK_MODE, value.toString());
        setDarkMode(value);
    }

    const themeConfig: ThemeConfig = darkMode ? 
    {
      "token": {
        "colorPrimary": "#c67ae6",
        "colorInfo": "#c67ae6"
      },
      "components": {
        "Layout": {
          "headerBg": "rgb(19,0,41)"
        },
        "Progress": {
          "motionDurationSlow": "0"
        }
      },
      "algorithm": theme.darkAlgorithm
    } : {
      "token": {
        "colorPrimary": "#722ed1",
        "colorInfo": "#722ed1"
      },
      "components": {
        "Layout": {
          "headerBg": "rgb(19,0,41)"
        },
        "Progress": {
          "motionDurationSlow": "0",
          "remainingColor": "rgba(0,0,0,0.10)"
        }
      },
      "algorithm": theme.defaultAlgorithm
    };

  return (
    <html lang="en">
      <body>
        {darkMode !== undefined && <>
          <AntdRegistry>
            <ConfigProvider
              theme={themeConfig}
            >
              <MainLayout darkMode={darkMode} onToggleDarkMode={toggleDarkMode}>
                {children}
              </MainLayout>
            </ConfigProvider>
          </AntdRegistry>
        </>}
      </body>
    </html>
  );
}