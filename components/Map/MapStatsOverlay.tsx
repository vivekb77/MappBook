import React, { useEffect, useContext, useState } from 'react';
import { getClerkSupabaseClient } from "@/components/utils/supabase";
import { useMappbookUser } from '@/context/UserContext';
import { AllUserPlacesContext } from '@/context/AllUserPlacesContext';
import { MapStatsContext } from '@/context/MapStatsContext';
import { MapPin, Plane, Globe2 } from 'lucide-react';
import PreventPullToRefresh from '@/components/DisablePullToRefresh';
import { track } from '@vercel/analytics';
interface StatBoxProps {
  count?: number;
  label: string;
  color: string;
  icon: React.ReactNode;
  loading?: boolean;
  position?: 'left' | 'bottom';
}

interface Place {
  place_id: string;
  mappbook_user_id: string;
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
  icon,
  loading = false,
  position = 'bottom'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const tooltipPosition = {
    bottom: {
      tooltip: "absolute left-1/2 -translate-x-1/2 top-full mt-2",
      arrow: "absolute left-1/2 -translate-x-1/2 bottom-full border-b-gray-900"
    },
    left: {
      tooltip: "absolute top-1/2 -translate-y-1/2 right-full mr-2",
      arrow: "absolute top-1/2 -translate-y-1/2 left-full border-l-gray-900"
    }
  };

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
          <div className={`${tooltipPosition[position].tooltip} 
            px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg 
            whitespace-nowrap z-50`}>
            {label}
            <div className={`${tooltipPosition[position].arrow}
              border-4 border-transparent`}></div>
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

const MapStatsOverlay: React.FC = () => {
  const {
    visitedPlacesCount,
    wantToVisitPlacesCount,
    visitedCountriesCount,
    setVisitedPlacesCount,
    setWantToVisitPlacesCount,
    setVisitedCountriesCount,
    setAllPlacesCount
  } = useContext(MapStatsContext);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const allUserPlacesContext = useContext<AllUserPlacesContextType | null>(AllUserPlacesContext);
  const userPlaces = allUserPlacesContext?.userPlaces || [];
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getClerkSupabaseClient();

  const fetchPlaceCounts = async (mappbook_user_id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('Mappbook_User_Places')
        .select(`
          place_id,
          visitedorwanttovisit,
          place_country_code,
          isRemoved
        `)
        .eq('mappbook_user_id', mappbook_user_id);

      if (error) {
        track('RED - Failed to fetch map stats on create Map');
        throw new Error('Failed to fetch places data');
      }

      let visitedCount = 0;
      let wantToVisitCount = 0;
      let allPlacesCount = 0;
      const visitedCountries = new Set();

      data.forEach(record => {
        allPlacesCount++;
        if (!record.isRemoved) {
          if (record.visitedorwanttovisit === 'visited') {
            visitedCount++;
            if (record.place_country_code) {
              visitedCountries.add(record.place_country_code);
            }
          } else if (record.visitedorwanttovisit === 'wanttovisit') {
            wantToVisitCount++;
          }
        }
      });

      setVisitedPlacesCount(visitedCount);
      setWantToVisitPlacesCount(wantToVisitCount);
      setVisitedCountriesCount(visitedCountries.size);
      setAllPlacesCount(allPlacesCount);

    } catch (err) {
      track('RED - Failed to fetch map stats on create Map');
      setError('An unexpected error occurred');
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const { mappbookUser, setMappbookUser } = useMappbookUser();
  
  useEffect(() => {
    if (mappbookUser) {
      fetchPlaceCounts(mappbookUser.mappbook_user_id);
    }else{
      setIsLoading(false);
    }
  }, [mappbookUser, userPlaces]);

  return (
    <PreventPullToRefresh>
    <div className="absolute top-3 left-0 right-0 md:right-3 md:left-auto">
      <div className="flex flex-col items-center md:items-end gap-2">
        <div className="flex md:flex-col gap-1.5 justify-center">
          <StatBox 
            count={visitedPlacesCount}
            color="text-blue-600"
            icon={<MapPin strokeWidth={2.5} className="w-4 h-4 text-blue-600" />}
            loading={isLoading}
            label="Places you've visited"
            position={isMobile ? 'bottom' : 'left'}
          />
          <StatBox
            count={wantToVisitPlacesCount}
            color="text-red-600"
            icon={<Plane strokeWidth={2.5} className="w-4 h-4 text-red-600" />}
            loading={isLoading}
            label="Places in your bucket list"
            position={isMobile ? 'bottom' : 'left'}
          />
          <StatBox
            count={visitedCountriesCount}
            color="text-indigo-600"
            icon={<Globe2 strokeWidth={2.5} className="w-4 h-4 text-indigo-600" />}
            loading={isLoading}
            label="Countries you've explored"
            position={isMobile ? 'bottom' : 'left'}
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
    </PreventPullToRefresh>
  );
};

export default MapStatsOverlay;