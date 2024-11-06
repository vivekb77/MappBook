import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';

// Environment variable validation
if (!process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_PROJECT_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Constants for Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a single anonymous client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Disable session persistence since we're using Clerk
  }
});

// Store the authenticated client instance
let authenticatedClient: ReturnType<typeof createClient> | null = null;

// Authenticated client with Clerk integration
export function useClerkSupabase() {
  const { session } = useSession();

  // If we already have a client, return it
  if (authenticatedClient) {
    return authenticatedClient;
  }

  // Create a new authenticated client
  authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Disable Supabase Auth since we're using Clerk
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: undefined // Disable storage to prevent conflicts
    },
    global: {
      fetch: async (url, options = {}) => {
        const clerkToken = await session?.getToken({
          template: 'supabase',
        });

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
  });

  return authenticatedClient;
}