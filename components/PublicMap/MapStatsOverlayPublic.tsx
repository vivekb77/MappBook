import React, { useEffect, useState } from 'react';
import { supabase } from "@/components/utils/supabase";
import { MapPin, Plane, Globe2, Map } from 'lucide-react';
import PreventPullToRefresh from '@/components/DisablePullToRefresh';

interface UserData {
  mappbook_user_id: string;
  display_name: string;
  is_premium_user: boolean;
  map_style: string;
  country_fill_color: string;
  map_views_left: number;
}

interface MapStatsOverlayProps {
  userData: UserData;
}

interface StatBoxProps {
  count?: number;
  color: string;
  icon: React.ReactNode;
  loading?: boolean;
  label: string;
}

const StatBox: React.FC<StatBoxProps> = ({
  count = 0,
  color,
  icon,
  loading = false,
  label
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <div 
        className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1.5 
        border border-pink-100/50 shadow-sm hover:shadow-md 
        transition-all duration-300 hover:scale-105 group
        w-[80px] cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={() => setShowTooltip(true)}
        onTouchEnd={() => setShowTooltip(false)}
      >
        <div className="flex items-center gap-1.5">
          <div className={`${color.replace('text-', 'bg-').replace('600', '100')} 
            rounded-md p-1 group-hover:scale-110 transition-transform duration-500
            ${loading ? 'animate-pulse' : ''}`}>
            {icon}
          </div>
          <div className="min-w-[32px]">
            {loading ? (
              <div className="h-4 w-[32px] bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <span className={`text-sm font-bold ${color} leading-none`}>
                {count.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute top-1/2 -translate-y-1/2 right-full mr-2
            px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg 
            whitespace-nowrap z-50">
            {label}
            <div className="absolute top-1/2 -translate-y-1/2 left-full
              border-4 border-transparent border-l-gray-900"></div>
          </div>
        )}
      </div>
    </div>
  );
};

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

  const fetchStats = async (mappbook_user_id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: places, error: placesError } = await supabase
        .from('Mappbook_User_Places')
        .select('visitedorwanttovisit, place_country_code')
        .eq('mappbook_user_id', mappbook_user_id)
        .eq('isRemoved', false);

      if (placesError) {
        throw new Error('Failed to fetch places data');
      }

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
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  useEffect(() => {
    if (userData.mappbook_user_id) {
      fetchStats(userData.mappbook_user_id);
    }
  }, [userData.mappbook_user_id]);

  return (
    <PreventPullToRefresh>
    <div className="absolute top-0 left-0 right-0 z-10">
      {/* Logo Section */}
      <div className="absolute top-3 left-3">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-2">
           <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
             rounded-xl p-2 shadow-md transform -rotate-3">
           </div>
           <h1 className="text-lg font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
               text-transparent bg-clip-text transform rotate-1">
             MappBook
           </h1>
          </div>
          <p className="text-xs font-medium text-purple-400 mt-0.5">
            Share Your World 🌎
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="absolute top-3 right-3">
        <div className="flex flex-col items-end gap-2">
          <h2 className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 
            text-transparent bg-clip-text px-2 mb-1">
            {userData.display_name}'s #MappBook
          </h2>
          <div className="flex flex-col gap-1.5">
            <StatBox
              count={stats.visitedCount}
              color="text-blue-600"
              icon={<MapPin strokeWidth={2.5} className="w-4 h-4 text-blue-600" />}
              loading={isLoading}
              label="Places visited"
            />
            <StatBox
              count={stats.wantToVisitCount}
              color="text-red-600"
              icon={<Plane strokeWidth={2.5} className="w-4 h-4 text-red-600" />}
              loading={isLoading}
              label="Places in bucket list"
            />
            <StatBox
              count={stats.countriesCount}
              color="text-indigo-600"
              icon={<Globe2 strokeWidth={2.5} className="w-4 h-4 text-indigo-600" />}
              loading={isLoading}
              label="Countries explored"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-2 mx-3 text-sm text-red-600 bg-white/90 px-3 py-1.5 rounded-md 
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
    </PreventPullToRefresh>
  );
};

export default MapStatsOverlayPublic;