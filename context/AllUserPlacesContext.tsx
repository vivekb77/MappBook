import { createContext, Dispatch, SetStateAction } from 'react';

interface AllUserPlacesContextType {
  userPlaces: any[];
  setAllUserPlaces: Dispatch<SetStateAction<any[]>>;
}

export const AllUserPlacesContext = createContext<AllUserPlacesContextType | null>(null);
