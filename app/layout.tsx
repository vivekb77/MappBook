import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { UserProvider } from '@/context/UserContext';
import UserCheck from '@/components/User/UserCheck';

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
    <ClerkProvider>
      <UserProvider>
        <UserCheck>
          <html lang="en">
            <body className={outfit.className}>
              {children}
            </body>
          </html>
        </UserCheck>
      </UserProvider>
    </ClerkProvider>
  );
}