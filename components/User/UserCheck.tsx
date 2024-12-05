"use client";
import { useEffect } from 'react';
import { useMappbookUser } from '@/context/UserContext';
import { useAuth, useUser as useClerkUser } from '@clerk/nextjs';
import { getClerkSupabaseClient } from "@/components/utils/supabase";
import { track } from '@vercel/analytics';

export default function UserCheck({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth();
  const { user: clerkUser } = useClerkUser();
  const { setMappbookUser } = useMappbookUser();
  const supabase = getClerkSupabaseClient();
  
  useEffect(() => {
    if (!userId || !clerkUser) return;
  
    const startTime = performance.now()
    const checkAndCreateUser = async () => {
      try {
        const { data: existingUser, error: fetchError } = await supabase
          .from('MappBook_Users')
          .select('mappbook_user_id, is_premium_user, total_map_views, map_views_left, display_name, map_style, country_fill_color')
          .eq('clerk_user_id', userId)
          .single();

        // Handle non-existent user case
        if (fetchError?.code === 'PGRST116' || !existingUser) {
          const { data: newUser, error: createError } = await supabase
            .from('MappBook_Users')
            .insert([{
              clerk_user_id: clerkUser.id,
              display_name: clerkUser.fullName,
            }])
            .select()
            .single();

          if (createError) {
            track('RED - Create MappBook - Failed to create new user', {
              error: createError.message
            });
            return;
          }

          setMappbookUser(newUser);
          track('Create MappBook - New user successfully created', {
            userId: newUser.mappbook_user_id
          });
          return;
        }

        // Handle database fetch errors
        if (fetchError) {
          track('RED - Create MappBook - Failed to create new user', {
            error: fetchError
          });
          return;
        }

        setMappbookUser(existingUser);
        const endTime = performance.now()          
        console.log(`Supabase query took ${endTime - startTime}ms`)
      } catch (error) {
        track('RED - Create MappBook - Failed to create new user', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    checkAndCreateUser();
  }, [isLoaded, userId, clerkUser, setMappbookUser]);

  return <>{children}</>;
}