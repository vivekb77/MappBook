import UserCheck from '@/components/User/UserCheck';
import { UserProvider } from '@/context/UserContext';
import { ClerkProvider } from '@clerk/nextjs';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
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