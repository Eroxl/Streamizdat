import React from 'react';
import './globals.css';
import QueryProvider from "@/lib/contexts/QueryProvider";

import { Metadata } from 'next';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'Streamizdat',
  description: 'Live stream',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-nord-dark h-screen flex flex-col text-nord6 overflow-clip">
        <QueryProvider>
          <NavBar />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
