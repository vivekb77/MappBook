import './globals.css';
import type { Metadata, Viewport } from 'next';
import { CSPostHogProvider } from '../app/provider';
import { Analytics } from '@vercel/analytics/react';
import { useEffect } from 'react';

export const metadata: Metadata = {
  title: 'MappBook.com',
  description: 'Share your World 🌎 Track your Adventures ✈️ Show the World where you have been 📍',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  // Removing userScalable: false for better accessibility
};

// Client component to handle viewport height calculations
function ViewportHandler() {
  useEffect(() => {
    // Function to update CSS custom property with correct viewport height
    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Initial calculation
    updateViewportHeight();

    // Update on resize and orientation change
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="googlebot" content="noindex,nofollow" />
      </head>
      <CSPostHogProvider>
        <body className="min-h-full">
          <ViewportHandler />
          {children}
          <Analytics />
        </body>
      </CSPostHogProvider>
    </html>
  );
}