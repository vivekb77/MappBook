import { createClient } from '@supabase/supabase-js';
import { useSession, useUser } from '@clerk/nextjs';

if (!process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_PROJECT_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}


  // Create a custom supabase client that injects the Clerk Supabase token into the request headers
  export function useClerkSupabase() {
    const { session } = useSession();
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          // Get the custom Supabase token from Clerk
          fetch: async (url, options = {}) => {
            const clerkToken = await session?.getToken({
              template: 'supabase',
            });

            // Insert the Clerk Supabase token into the headers
            const headers = new Headers(options?.headers);
            headers.set('Authorization', `Bearer ${clerkToken}`);

            // Now call the default fetch
            return fetch(url, {
              ...options,
              headers,
            });
          },
        },
      }
    );
  }

