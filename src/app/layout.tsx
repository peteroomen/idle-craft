import type { Metadata, Viewport } from 'next';
import Providers from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ironbark',
  description: 'An idle crafting RPG. Pick a tree, close the tab, come back to a bank full of logs.',
};

export const viewport: Viewport = {
  themeColor: '#130029',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
