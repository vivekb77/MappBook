import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../supabase';
import { useUser } from '@clerk/nextjs';
import { AllUserPlacesContext } from '@/context/AllUserPlacesContext';

interface StatBoxProps {
  count?: number;
  label: string;
  color: string;
}
interface Place {
  id: string;
  clerk_user_id: string;
  place_name: string;
  place_full_address: string;
  place_longitude: number;
  place_latitude: number;
  place_country: string;
  place_country_code: string;
  visitedorwanttovisit: 'visited' | 'wanttovisit';
  isRemoved?: boolean;
}

interface AllUserPlacesContextType {
  userPlaces: Place[];
  setAllUserPlaces: React.Dispatch<React.SetStateAction<Place[]>>;
}
const StatBox: React.FC<StatBoxProps> = ({ 
  count = 0, 
  label, 
  color 
}) => (
  <div className="flex flex-col items-center bg-white/95 rounded-lg p-4 shadow-md">
    <span className={`text-3xl font-bold ${color}`}>
      {(count ?? 0).toLocaleString()}
    </span>
    <span className="text-gray-600 font-medium text-sm mt-1">
      {label}
    </span>
  </div>
);

const MapStatsOverlay: React.FC = () => {
  const [countVisitedPlaces, setCountVisitedPlaces] = useState<number>(0);
  const [countWantToVisitPlaces, setCountWantToVisitPlaces] = useState<number>(0);
  const [countVisitedCountries, setCountVisitedCountries] = useState<number>(0);
  const { isLoaded, isSignedIn, user } = useUser();

  const allUserPlacesContext = useContext<AllUserPlacesContextType | null>(AllUserPlacesContext);
  const [userPlaces, setAllUserPlaces] = allUserPlacesContext
    ? [allUserPlacesContext.userPlaces, allUserPlacesContext.setAllUserPlaces]
    : [[] as Place[], () => {}];


  const fetchPlaceCounts = async (userId: string) => {
    try {
      // Get visited places count
      const { count: visitedCount, error: visitedError } = await supabase
        .from('Mappbook_User_Places')
        .select('*', { count: 'exact', head: true })
        .eq('clerk_user_id', userId)
        .eq('isRemoved', false)
        .eq('visitedorwanttovisit', 'visited');

      if (visitedError) {
        console.error("Error fetching visited count:", visitedError);
      } else {
        setCountVisitedPlaces(visitedCount || 0);
      }

      // Get want to visit places count
      const { count: wantToVisitCount, error: wantToVisitError } = await supabase
        .from('Mappbook_User_Places')
        .select('*', { count: 'exact', head: true })
        .eq('clerk_user_id', userId)
        .eq('isRemoved', false)
        .eq('visitedorwanttovisit', 'wanttovisit');

      if (wantToVisitError) {
        console.error("Error fetching want to visit count:", wantToVisitError);
      } else {
        setCountWantToVisitPlaces(wantToVisitCount || 0);
      }

      // Get visited countries count
      const { data, error } = await supabase
        .from('Mappbook_User_Places')
        .select('place_country_code')
        .eq('clerk_user_id', userId)
        .eq('isRemoved', false)
        .eq('visitedorwanttovisit', 'visited');

      if (error) {
        console.error("Error fetching countries:", error);
        return;
      }
      const uniqueCountryCounts = new Set(data.map(place => place.place_country_code)).size;
      setCountVisitedCountries(uniqueCountryCounts || 0);

    } catch (err) {
      console.error("Error fetching visited count:", err);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user?.id && process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
      fetchPlaceCounts(user.id);
    }
  }, [isLoaded, isSignedIn, user, userPlaces]); // Added places as a dependency

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="absolute bottom-6 right-6 z-10">
      <div className="flex gap-4">
        <StatBox 
          count={countVisitedPlaces}
          label="Visited" 
          color="text-green-600"
        />
        <StatBox 
          count={countWantToVisitPlaces}
          label="Want to Visit" 
          color="text-blue-600"
        />
        <StatBox 
          count={countVisitedCountries}
          label="Countries" 
          color="text-purple-600"
        />
      </div>
    </div>
  );
};

export default MapStatsOverlay;