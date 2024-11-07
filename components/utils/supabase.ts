import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import { useMemo } from 'react';

if (!process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_PROJECT_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Non auth pages use - Create a single anonymous client instance
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false // Disable session persistence since we're using Clerk
  }
});

// auth pages use
export function getClerkSupabaseClient() {
  const { session } = useSession();
  
  const supabase = useMemo(() => 
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      {
        global: {
          async fetch(url, options = {}) {
            const clerkToken = await session?.getToken({ template: 'supabase' });
            const headers = new Headers(options?.headers);
            if (clerkToken) {
              headers.set('Authorization', `Bearer ${clerkToken}`);
            }
            return fetch(url, {
              ...options,
              headers,
            });
          },
        },
        auth: {
          persistSession: false // Don't persist as we're using Clerk
        }
      }
    ), [session]  // Include session in dependencies
  );

  return supabase;
}