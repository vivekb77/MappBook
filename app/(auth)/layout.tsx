import UserCheck from '@/components/User/UserCheck';
import { UserProvider } from '@/context/UserContext';
import { ClerkProvider } from '@clerk/nextjs';
import { TeamProvider } from '../../components/IPL/TeamContext';

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
          <TeamProvider>
            {children}
            </TeamProvider>
          </UserCheck>
        </UserProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}