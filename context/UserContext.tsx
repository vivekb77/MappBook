"use client";
import { createContext, useContext, useState, ReactNode } from 'react';
export type MappBookUser = {
  mappbook_user_id: string;
    display_name : string;
    poll_credits: number
  };

interface UserContextType {
  mappbookUser: MappBookUser | null;
  setMappbookUser: (user: MappBookUser | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [mappbookUser, setMappbookUser] = useState<MappBookUser | null>(null);

  return (
    <UserContext.Provider value={{ mappbookUser, setMappbookUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useMappbookUser() { 
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useMappbookUser must be used within a UserProvider');
  }
  return context;
}


// // supabase file that works but creates multiple goclients warning messages
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
// import { useSession } from '@clerk/nextjs';

// if (!process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL) {
//   throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_PROJECT_URL');
// }
// if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
//   throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
// }

// export function getClerkSupabaseClient() {
//   const { session } = useSession();
  
//   const supabase = createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL as string,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
//     {
//       global: {
//         async fetch(url, options = {}) {
//           const clerkToken = await session?.getToken({ template: 'supabase' });
//           const headers = new Headers(options?.headers);
//           if (clerkToken) {
//             headers.set('Authorization', `Bearer ${clerkToken}`);
//           }
//           return fetch(url, {
//             ...options,
//             headers,
//           });
//         },
//       },
//     }
//   );

//   return supabase;
// }
