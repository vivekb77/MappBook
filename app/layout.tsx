import './globals.css';
import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { CSPostHogProvider } from '../app/provider'

export const metadata: Metadata = {
  title: 'MappBook',
  description: 'Show the world where you have been.',
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
    </html>
  );
}