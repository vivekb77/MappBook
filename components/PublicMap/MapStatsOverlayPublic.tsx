import React, { useEffect, useContext } from 'react';
import { supabase } from '../supabase';
import { useUser } from '@clerk/nextjs';
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

const MapStatsOverlayPublic: React.FC = () => {
  const { isLoaded, isSignedIn, user } = useUser();


  const fetchPlaceCounts = async (userId: string) => {
    try {
      // Get visited places count
      const { count: visitedCount, error: visitedError } = await supabase
        .from('Mappbook_User_Places')
        .select('*', { count: 'exact', head: true })
        .eq('clerk_user_id', userId)
        .eq('isRemoved', false)
        .eq('visitedorwanttovisit', 'visited');

      if (!visitedError) {
        setVisitedPlacesCount(visitedCount || 0);
      }

      // Get want to visit places count
      const { count: wantToVisitCount, error: wantToVisitError } = await supabase
        .from('Mappbook_User_Places')
        .select('*', { count: 'exact', head: true })
        .eq('clerk_user_id', userId)
        .eq('isRemoved', false)
        .eq('visitedorwanttovisit', 'wanttovisit');

      if (!wantToVisitError) {
        setWantToVisitPlacesCount(wantToVisitCount || 0);
      }

      // Get visited countries count
      const { data, error } = await supabase
        .from('Mappbook_User_Places')
        .select('place_country_code')
        .eq('clerk_user_id', userId)
        .eq('isRemoved', false)
        .eq('visitedorwanttovisit', 'visited');

      if (!error) {
        const uniqueCountryCounts = new Set(data.map(place => place.place_country_code)).size;
        setVisitedCountriesCount(uniqueCountryCounts);
      }

    } catch (err) {
      console.error("Error fetching place counts:", err);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      fetchPlaceCounts(user.id);
    }
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
      <div className="flex gap-4">
        <StatBox
          count={visitedPlacesCount}
          label=""
          color="text-blue-600"
          icon={<MapPin className="w-6 h-6 text-blue-600" />}
        />
        <StatBox
          count={wantToVisitPlacesCount}
          label=""
          color="text-red-600"
          icon={<Plane className="w-6 h-6 text-red-600" />}
        />
        <StatBox
          count={visitedCountriesCount}
          label=""
          color="text-indigo-600"
          icon={<Globe2 className="w-6 h-6 text-indigo-600" />}
        />
      </div>
    </div>
  );
};

export default MapStatsOverlayPublic;