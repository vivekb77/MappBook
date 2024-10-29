import { createClient } from "@supabase/supabase-js";
if (!process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_PROJECT_URL');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_API_KEY) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_API_KEY');
  }
export const supabase = createClient(`${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL}`, `${process.env.NEXT_PUBLIC_SUPABASE_API_KEY}`)
