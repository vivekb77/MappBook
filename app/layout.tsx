// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { CSPostHogProvider } from '../app/provider';
import { Analytics } from '@vercel/analytics/react';
import { ViewportHandler } from '@/components/utils/ViewportHandler';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: 'MappBook.com',
  description: 'Share your World 🌎 Track your Adventures ✈️ Show the World where you have been 📍',
  robots: {
    index: false,
    follow: false,
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <CSPostHogProvider>
      <body className="min-h-full">
          <ViewportHandler />
          {children}
          <Analytics />
          <SpeedInsights />
      </body>
      </CSPostHogProvider>
    </html>
  );
}