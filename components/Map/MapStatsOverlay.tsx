import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../supabase';
import { useUser } from '@clerk/nextjs';
import { AllUserPlacesContext } from '@/context/AllUserPlacesContext';
import { MapPin, Plane, Globe2 } from 'lucide-react';

interface StatBoxProps {
  count?: number;
  label: string;
  color: string;
  icon: React.ReactNode;
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
  color, 
  icon 
}) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2.5 
    border border-pink-100/50 shadow-sm hover:shadow-md
    transition-all duration-300 hover:scale-105 group">
    <div className="flex items-center gap-3">
      <div className={`${color.replace('text-', 'bg-').replace('600', '100')} 
        rounded-lg p-1.5 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className={`text-lg font-bold ${color} leading-none`}>
          {count.toLocaleString()}
        </span>
        <span className="text-xs text-gray-500 font-medium mt-0.5">
          {label}
        </span>
      </div>
    </div>
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
  }, [isLoaded, isSignedIn, user, userPlaces]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
      <div className="flex gap-4">
        <StatBox 
          count={countVisitedPlaces}
          label="Places Visited" 
          color="text-emerald-600"
          icon={<MapPin className="w-6 h-6 text-emerald-600" />}
        />
        <StatBox 
          count={countWantToVisitPlaces}
          label="Want to Visit" 
          color="text-blue-600"
          icon={<Plane className="w-6 h-6 text-blue-600" />}
        />
        <StatBox 
          count={countVisitedCountries}
          label="Countries Visited" 
          color="text-indigo-600"
          icon={<Globe2 className="w-6 h-6 text-indigo-600" />}
        />
      </div>
    </div>
  );
};

export default MapStatsOverlay;