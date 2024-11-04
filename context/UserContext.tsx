"use client";
import { createContext, useContext, useState, ReactNode } from 'react';
export type MappBookUser = {
  mappbook_user_id: string;
    clerk_user_id: string;
    is_premium_user?: boolean;
    total_map_views: number;
    map_views_left: number;
    display_name : string;
    map_style: string;
    country_fill_color : string;
    email_address : string;
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