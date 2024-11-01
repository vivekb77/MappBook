// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { UserProvider } from '@/context/UserContext';
import UserCheck from '@/components/User/UserCheck';

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
      <body className={outfit.className}>
        <ClerkProvider>
          <UserProvider>
            <UserCheck>
                {children}
            </UserCheck>
          </UserProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}