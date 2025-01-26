import './globals.css';
import type { Metadata, Viewport } from 'next';
import { CSPostHogProvider } from '../app/provider';
import { Analytics } from '@vercel/analytics/react';
import { ViewportHandler } from '@/components/utils/ViewportHandler';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'MappBook.com',
  description: 'Geotargeting Analytics for Amazon Seller Central Order Reports',
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
      <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;
              var ttq=w[t]=w[t]||[];
              ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
              ttq.setAndDefer=function(t,e){
                t[e]=function(){
                  t.push([e].concat(Array.prototype.slice.call(arguments,0)))
                }
              };
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.instance=function(t){
                for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);
                return e
              };
              ttq.load=function(e,n){
                var r="https://analytics.tiktok.com/i18n/pixel/events.js";
                var o=n&&n.partner;
                ttq._i=ttq._i||{};
                ttq._i[e]=[];
                ttq._i[e]._u=r;
                ttq._t=ttq._t||{};
                ttq._t[e]=+new Date;
                ttq._o=ttq._o||{};
                ttq._o[e]=n||{};
                var i=document.createElement("script");
                i.type="text/javascript";
                i.async=!0;
                i.src=r+"?sdkid="+e+"&lib="+t;
                var s=document.getElementsByTagName("script")[0];
                s.parentNode.insertBefore(i,s);
              };
              ttq.load('CTUTUJJC77UBA10LS7B0');
              ttq.page();
            }(window, document, 'ttq');
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