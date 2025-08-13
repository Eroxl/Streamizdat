import React from 'react';
import './globals.css';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Streamizdat',
  description: 'Live stream',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 min-h-screen text-neutral-200 overflow-clip">
        {children}
      </body>
    </html>
  );
}
