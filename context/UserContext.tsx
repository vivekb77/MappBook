"use client";
import { createContext, useContext, useState, ReactNode } from 'react';
export type MappBookUser = {
    id: string;
    clerk_user_id: string;
    display_name: string;
    created_at?: string;
  };

interface UserContextType {
  user: MappBookUser | null;
  setUser: (user: MappBookUser | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MappBookUser | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}