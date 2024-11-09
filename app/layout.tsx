import './globals.css';
import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { CSPostHogProvider } from '../app/provider'
const outfit = Outfit({ subsets: ['latin'] });

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
       <CSPostHogProvider>
      <body className={outfit.className}>
          {children}
      </body>
      </CSPostHogProvider>
    </html>
  );
}