// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { UserProvider } from '@/context/UserContext';
import UserCheck from '@/components/User/UserCheck';
import { MapStatsProvider } from '@/context/MapStatsContext';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MappBook',
  description: 'Tell the world where have you been',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <ClerkProvider>
          <UserProvider>
            <UserCheck>
              <MapStatsProvider>
                {children}
              </MapStatsProvider>
            </UserCheck>
          </UserProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}