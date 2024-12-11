"use client";

import { useEffect, useState, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { track } from '@vercel/analytics';
import { useSearchParams } from 'next/navigation';
import { supabase } from "@/components/utils/supabase";
import PassportFlipBook from '@/components/Passport/FlipBook';

interface Place {
  visitedorwanttovisit: 'visited' | 'wanttovisit';
  place_country: string;
  place_country_code: string;
  place_name: string;
}

interface Location {
  place_names: string[];
  place_country: string;
  place_country_code: string;
}

export default function PlayFlipBook() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full bg-[#F5E6D3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-lg text-gray-600">Loading your passport...</p>
        </div>
      </div>
    }>
      <PlayFlipBookContent />
    </Suspense>
  );
}

function PlayFlipBookContent() {
  const searchParams = useSearchParams();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPlaces = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userId = searchParams.get('userId');
        if (!userId) throw new Error('User ID is required');

        const { data, error: fetchError } = await supabase
          .from('Mappbook_User_Places')
          .select('visitedorwanttovisit,place_country,place_country_code,isRemoved,place_name')
          .eq('mappbook_user_id', userId)
          .eq('visitedorwanttovisit', 'visited')
          .is('isRemoved', false);

        if (fetchError) {
          track('RED - Failed to fetch places for flipbook');
          throw new Error('Failed to fetch places');
        }

        const countryGroups = data?.reduce((acc: { [key: string]: { places: string[], countryCode: string } }, place) => {
          if (place.place_name === place.place_country) return acc;
          if (!acc[place.place_country]) {
            acc[place.place_country] = { places: [], countryCode: place.place_country_code };
          }
          acc[place.place_country].places.push(place.place_name);
          return acc;
        }, {});

        const formattedLocations: Location[] = Object.entries(countryGroups || {}).map(([country, data]) => ({
          place_names: data.places,
          place_country: country,
          place_country_code: data.countryCode
        }));

        setLocations(formattedLocations);
      } catch (err) {
        console.error('Error fetching places:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        track('RED - Failed to fetch places for flipbook');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserPlaces();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#F5E6D3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-lg text-gray-600">Loading your passport...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full bg-[#F5E6D3] flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-lg text-red-600 mb-2">Failed to load passport data</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="h-screen w-full bg-[#F5E6D3] flex items-center justify-center">
        <p className="text-lg text-gray-600">No visited places found in passport</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-screen w-full bg-[#F5E6D3] flex flex-col">
        <div className="flex-1 overflow-hidden">
          <PassportFlipBook locations={locations} />
        </div>
      </div>
      <div className="flex-none bg-[#F5E6D3] pt-1">
        <h2 className="text-xl font-semibold px-4 mb-1 text-gray-800">Places Visited</h2>
        <div className="h-96 overflow-y-auto">
          <table className="w-full border-collapse bg-white shadow-sm">
            <thead className="bg-purple-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Country</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cities</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location, index) => (
                <tr key={location.place_country_code} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-1.5 text-sm text-gray-800 font-medium border-t">{location.place_country}</td>
                  <td className="px-4 py-1.5 text-sm text-gray-600 border-t">{location.place_names.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}