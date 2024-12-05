// In your context file (UserDataContextPublicMap.ts)
import { createContext } from 'react';

export interface UserData {
  mappbook_user_id: string;
  display_name: string;
  is_premium_user: boolean;
  map_style: string;
  country_fill_color: string;
  map_views_left: number | null; // Make it match with your component's type
}

export type UserDataContextType = UserData | null;

export const UserDataContext = createContext<UserDataContextType>(null);