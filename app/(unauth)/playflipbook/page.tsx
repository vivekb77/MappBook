"use client";

import { useEffect, useState } from 'react';
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
  place_names: string[];  // Changed to array of place names
  place_country: string;
  place_country_code: string;
}

export default function PlayFlipBook() {
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

        if (!userId) {
          throw new Error('User ID is required');
        }

        const { data, error: fetchError } = await supabase
          .from('Mappbook_User_Places')
          .select(`
            visitedorwanttovisit,
            place_country,
            place_country_code,
            isRemoved,
            place_name
          `)
          .eq('mappbook_user_id', userId)
          .eq('visitedorwanttovisit', 'visited')
          .is('isRemoved', false);

        if (fetchError) {
          track('RED - Failed to fetch places for flipbook');
          throw new Error('Failed to fetch places');
        }

        // Group places by country and keep track of country code
        const countryGroups = data?.reduce((acc: { [key: string]: { places: string[], countryCode: string } }, place) => {
          // Skip if place name is same as country
          if (place.place_name === place.place_country) return acc;
          
          // Initialize object for country if it doesn't exist
          if (!acc[place.place_country]) {
            acc[place.place_country] = {
              places: [],
              countryCode: place.place_country_code
            };
          }
          
          // Add place to country's array
          acc[place.place_country].places.push(place.place_name);
          return acc;
        }, {});

        // Convert grouped data to locations format
        const formattedLocations: Location[] = Object.entries(countryGroups || {}).map(([country, data]) => ({
          place_names: data.places, // Keep as array instead of joining
          place_country: country,
          place_country_code: data.countryCode
        }));

        setLocations(formattedLocations);
        console.log("Locations data ->", JSON.stringify(formattedLocations));
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
      <div className="h-[1920px] w-[1080px] bg-[#F5E6D3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
          <p className="text-xl text-gray-600">Loading your passport...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[1920px] w-[1080px] bg-[#F5E6D3] flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <p className="text-xl text-red-600 mb-4">Failed to load passport data</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="h-[1920px] w-[1080px] bg-[#F5E6D3] flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <p className="text-xl text-gray-600">No visited places found in passport</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[1920px] w-[1080px] bg-[#F5E6D3] overflow-hidden">
      <PassportFlipBook locations={locations} />
    </div>
  );
}