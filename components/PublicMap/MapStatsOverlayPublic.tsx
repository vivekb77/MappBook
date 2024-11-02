import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { MapPin, Plane, Globe2 } from 'lucide-react';

interface UserData {
  clerk_user_id : string;
  id: string;
  display_name: string;
  is_premium_user: boolean;
  map_style: string;
  total_map_views: number;
}

interface MapStatsOverlayProps {
  userData: UserData;
}

interface StatBoxProps {
  count?: number;
  color: string;
  icon: React.ReactNode;
  loading?: boolean;
}

const StatBox: React.FC<StatBoxProps> = ({
  count = 0,
  color,
  icon,
  loading = false
}) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2.5 
    border border-pink-100/50 shadow-sm hover:shadow-md
    transition-all duration-300 hover:scale-105 group">
    <div className="flex items-center gap-3">
      <div className={`${color.replace('text-', 'bg-').replace('600', '100')} 
        rounded-lg p-1.5 group-hover:scale-110 transition-transform duration-500
        ${loading ? 'animate-pulse' : ''}`}>
        {icon}
      </div>
      <div className="flex flex-col">
        {loading ? (
          <div className="flex flex-col gap-1.5">
            <div className="h-5 w-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ) : (
          <>
            <span className={`text-lg font-bold ${color} leading-none`}>
              {count.toLocaleString()}
            </span>
          </>
        )}
      </div>
    </div>
  </div>
);

const LoadingOverlay: React.FC = () => (
  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm 
    flex items-center justify-center rounded-xl z-20">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
    </div>
  </div>
);

const MapStatsOverlayPublic: React.FC<MapStatsOverlayProps> = ({ userData }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    visitedCount: 0,
    wantToVisitCount: 0,
    countriesCount: 0
  });
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (clerk_user_id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Single query to fetch all places
      const { data: places, error: placesError } = await supabase
        .from('Mappbook_User_Places')
        .select('visitedorwanttovisit, place_country_code')
        .eq('clerk_user_id', clerk_user_id)
        .eq('isRemoved', false);

      if (placesError) {
        throw new Error('Failed to fetch places data');
      }

      // Process the data locally
      const visitedPlaces = places.filter(place => place.visitedorwanttovisit === 'visited');
      const wantToVisitPlaces = places.filter(place => place.visitedorwanttovisit === 'wanttovisit');
      const uniqueCountries = new Set(visitedPlaces.map(place => place.place_country_code));

      setStats({
        visitedCount: visitedPlaces.length,
        wantToVisitCount: wantToVisitPlaces.length,
        countriesCount: uniqueCountries.size
      });

    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      // Add a minimum delay to prevent flickering on fast connections
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  useEffect(() => {
    if (userData.clerk_user_id) {
      fetchStats(userData.clerk_user_id);
    }
  }, [userData.clerk_user_id]);

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
      <div className="relative">
        <div className="flex gap-4">
          <StatBox
            count={stats.visitedCount}
            color="text-blue-600"
            icon={<MapPin strokeWidth={2.5} className="w-6 h-6 text-blue-600" />}
            loading={isLoading}
          />
          <StatBox
            count={stats.wantToVisitCount}
            color="text-red-600"
            icon={<Plane strokeWidth={2.5} className="w-6 h-6 text-red-600" />}
            loading={isLoading}
          />
          <StatBox
            count={stats.countriesCount}
            color="text-indigo-600"
            icon={<Globe2 strokeWidth={2.5} className="w-6 h-6 text-indigo-600" />}
            loading={isLoading}
          />
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-600 bg-white/90 px-3 py-1.5 rounded-md 
            shadow-sm border border-red-100 animate-fade-in">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapStatsOverlayPublic;