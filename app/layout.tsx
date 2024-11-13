import './globals.css';
import type { Metadata } from 'next';
import { CSPostHogProvider } from '../app/provider'
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'MappBook.com',
  description: 'Share your World 🌎 Track your Adventures ✈️ Show the World where you have been 📍',
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="googlebot" content="noindex,nofollow" />
      </head>
      <CSPostHogProvider>
        <body>
            {children}
        </body>
      </CSPostHogProvider>
      <Analytics />
    </html>
  );
}