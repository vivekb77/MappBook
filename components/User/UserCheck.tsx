"use client";
import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useAuth, useUser as useClerkUser } from '@clerk/nextjs';
import { supabase } from '../supabase';

export default function UserCheck({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth();
  const { user: clerkUser } = useClerkUser();
  const { setUser } = useUser();

  useEffect(() => {
    async function checkAndCreateUser() {
      if (!userId || !clerkUser) return;

      try {
        const { data: existingUser, error: fetchError } = await supabase
          .from('MappBook_Users')
          .select('*')
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
                clerk_user_id: userId,
                display_name: clerkUser.firstName && clerkUser.lastName 
                  ? `${clerkUser.firstName} ${clerkUser.lastName}`
                  : clerkUser.username || 'Anonymous User',
              },
            ])
            .select()
            .single();

          if (createError) {
            console.error('Error creating user:', createError);
            return;
          }

          setUser(newUser);
        } else {
          setUser(existingUser);
        }
      } catch (error) {
        console.error('Error in checkAndCreateUser:', error);
      }
    }

    if (isLoaded && userId) {
      checkAndCreateUser();
    }
  }, [isLoaded, userId, clerkUser, setUser]);

  return <>{children}</>;
}
