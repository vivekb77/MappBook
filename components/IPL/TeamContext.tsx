//TeamContext.tsx
"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define the shape of our context state
interface TeamContextType {
  selectedTeam: string;
  homeHexagon: number | null;
  setTeamData: (team: string, hexagon: number | null) => void;
  isTeamSelected: boolean;
}

// Create context with default values
const TeamContext = createContext<TeamContextType>({
  selectedTeam: '',
  homeHexagon: null,
  setTeamData: () => {},
  isTeamSelected: false
});

// Storage constants (matching those in SetFandomPopup)
const STORAGE_KEY = 'userTeamPreference';

interface TeamProviderProps {
  children: ReactNode;
}

export const TeamProvider: React.FC<TeamProviderProps> = ({ children }) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [homeHexagon, setHomeHexagon] = useState<number | null>(null);
  const [isTeamSelected, setIsTeamSelected] = useState<boolean>(false);

  // Load saved preferences from localStorage on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPrefs = localStorage.getItem(STORAGE_KEY);
        if (savedPrefs) {
          const prefs = JSON.parse(savedPrefs);
          if (prefs.team) {
            setSelectedTeam(prefs.team);
            setHomeHexagon(prefs.homeHexagon);
            setIsTeamSelected(true);
          }
        }
      } catch (error) {
        console.error('Error loading team preferences in context:', error);
      }
    }
  }, []);

  // Function to update team data
  const setTeamData = (team: string, hexagon: number | null) => {
    setSelectedTeam(team);
    setHomeHexagon(hexagon);
    setIsTeamSelected(!!team);
  };

  return (
    <TeamContext.Provider 
      value={{ 
        selectedTeam, 
        homeHexagon, 
        setTeamData,
        isTeamSelected
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

// Custom hook to use the team context
export const useTeam = () => useContext(TeamContext);

export default TeamContext;