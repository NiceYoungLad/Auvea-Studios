import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'AUVEA Job Assistant',
  description: 'AI-assisted job discovery and application workflow.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
