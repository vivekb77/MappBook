import './globals.css';
import type { Metadata, Viewport } from 'next';
import { CSPostHogProvider } from '../app/provider';
import { Analytics } from '@vercel/analytics/react';
import { ViewportHandler } from '@/components/utils/ViewportHandler';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'MappBook.com',
  description: 'IPL Fan Map 2025 - Vote for your favourite IPL team',
  robots: {
    index: true,
    follow: true,
  },
  // Add additional metadata for better SEO
  openGraph: {
    title: 'MappBook.com',
    description: 'IPL Fan Map 2025 - Vote for your favourite IPL team',
    type: 'website',
    images: [
      {
        url: 'https://www.mappbook.com/twitter-card.png',
        width: 1200,
        height: 628,
        alt: 'IPL Fan Map 2025 - Vote for your favourite IPL team on MappBook.com',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MappBook.com',
    description: 'IPL Fan Map 2025 - Vote for your favourite IPL team',
    images: ['https://www.mappbook.com/twitter-card.png'],
  }
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1519931816826082"
          crossOrigin="anonymous"></script>

        {/* Google Tag Manager Script - Strategy: afterInteractive ensures it loads after page interaction */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-16818860554"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-16818860554');
          `}
        </Script>
        <Script id="reddit-pixel" strategy="afterInteractive">
          {`
            !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);
            rdt('init','a2_g0e9s278ddr2');
            rdt('track', 'PageVisit');
          `}
        </Script>

      </head>
      {/* <body className="min-h-screen-dynamic"> */}
      <body className="min-h-screen-dynamic overflow-x-hidden">
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