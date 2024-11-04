"use client";
import { useEffect } from 'react';
import { useMappbookUser } from '@/context/UserContext';
import { useAuth, useUser as useClerkUser } from '@clerk/nextjs';
import { supabase } from '../utils/supabase';

export default function UserCheck({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth();
  const { user: clerkUser } = useClerkUser();
  const { setMappbookUser } = useMappbookUser();

  useEffect(() => {
    async function checkAndCreateUser() {
      if (!userId || !clerkUser) return;

      try {
        const { data: existingUser, error: fetchError } = await supabase
          .from('MappBook_Users')
          .select('mappbook_user_id,clerk_user_id, is_premium_user, total_map_views, map_views_left, display_name, map_style, country_fill_color, email_address')
          .eq('clerk_user_id', userId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching user:', fetchError);
          return;
        }

        if (!existingUser) {
          const { data: newUser, error: createError } = await supabase
            .from('MappBook_Users')
            .insert([
              {
                clerk_user_id: clerkUser.id,
                display_name: clerkUser.fullName,
                email_address:clerkUser.primaryEmailAddress?.emailAddress,
              },
            ])
            .select()
            .single();

          if (createError) {
            console.error('Error creating user:', createError);
            return;
          }

          setMappbookUser(newUser);
          console.log("New user created" + JSON.stringify(newUser))
        } else {
          setMappbookUser(existingUser);
          console.log("Existing user " + JSON.stringify(existingUser))
        }
      } catch (error) {
        console.error('Error in checkAndCreateUser:', error);
      }
    }

    if (isLoaded && userId) {
      checkAndCreateUser();
    }
  }, [isLoaded, userId, clerkUser, setMappbookUser]);

  return <>{children}</>;
}
