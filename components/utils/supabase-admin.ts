import { createClient } from '@supabase/supabase-js';

export const getSupabaseAdmin = () => 
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );