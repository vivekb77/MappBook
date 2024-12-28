import './globals.css';
import type { Metadata, Viewport } from 'next';
import { CSPostHogProvider } from '../app/provider';
import { Analytics } from '@vercel/analytics/react';
import { ViewportHandler } from '@/components/utils/ViewportHandler';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'MappBook.com',
  description: 'Create Stunning Drone-Like Footage Using Maps',
  robots: {
    index: true,
    follow: true,
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <Script id="reddit-pixel" strategy="afterInteractive">
          {`
            !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);
            rdt('init','a2_g0e9s278ddr2');
            rdt('track', 'PageVisit');
          `}
        </Script>
      </head>
      <body className="min-h-screen-dynamic">
        <CSPostHogProvider>
          <ViewportHandler />
          {children}
          <Analytics />
          <SpeedInsights />
        </CSPostHogProvider>
      </body>
    </html>
  );
}