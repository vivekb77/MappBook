"use client";

import { useEffect, useState, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { track } from '@vercel/analytics';
import { useSearchParams } from 'next/navigation';
import { supabase } from "@/components/utils/supabase";
import PassportFlipBook from '@/components/Dashboard/FlipBook';

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
      <div className="h-screen-dynamic w-full flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-5">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-purple-100" />
            <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-t-[3px] border-pink-400"
              style={{ animationDirection: 'reverse' }} />
          </div>
          <span className="text-lg font-medium text-gray-700">
            Loading 🌎 📘
          </span>
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
        const isPassportVideoPremiumUser = searchParams.get('isPremium') === 'true';
        if (!userId) throw new Error('User ID is required');

        // Fetch stamp data first
        const stampResponse = await fetch('/api/get-assets?type=json&name=country_stamps.json');
        const stampData = await stampResponse.json();
        
        // Create stamp lookup map
        const countryStampMap = stampData.country_stamps.reduce((acc: { [key: string]: boolean }, stamp: any) => {
          acc[stamp.country_code] = stamp.isStampPresent === "Yes";
          return acc;
        }, {});

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
          // Only process if country has a stamp available
          if (countryStampMap[place.place_country_code]) {
            // Initialize the country entry if it doesn't exist
            if (!acc[place.place_country]) {
              acc[place.place_country] = { places: [], countryCode: place.place_country_code };
            }
            
            // Only add the place if it's different from the country
            if (place.place_name !== place.place_country) {
              acc[place.place_country].places.push(place.place_name);
            }
          }
          return acc;
        }, {});

        let formattedLocations: Location[] = Object.entries(countryGroups || {}).map(([country, data]) => ({
          place_names: data.places,
          place_country: country,
          place_country_code: data.countryCode
        }));

        // Group and sort locations
        const locationGroups = formattedLocations.reduce((acc, location) => {
          const countryCode = location.place_country_code;
          if (!acc[countryCode]) {
            acc[countryCode] = {
              locations: [],
              totalPlaces: 0,
              country: location.place_country
            };
          }
          acc[countryCode].locations.push(location);
          acc[countryCode].totalPlaces += location.place_names.length;
          return acc;
        }, {} as Record<string, {
          locations: Location[],
          totalPlaces: number,
          country: string
        }>);

        // Sort countries by total places and alphabetically for ties
        let sortedLocations = Object.values(locationGroups)
          .sort((a, b) => {
            const placeDiff = b.totalPlaces - a.totalPlaces;
            if (placeDiff === 0) {
              return a.country.localeCompare(b.country);
            }
            return placeDiff;
          })
          .flatMap(group => group.locations);

        // Limit to 5 locations for non-premium users
        if (!isPassportVideoPremiumUser) {
          sortedLocations = sortedLocations.slice(0, 7);
        }

        // Ensure even number of locations
        if (sortedLocations.length % 2 !== 0) {
          sortedLocations.push({
            place_names: [],
            place_country: "",
            place_country_code: ""
          });
        }

        setLocations(sortedLocations);
        console.log("locations to stamp - "+sortedLocations.length);
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
      <div className="h-screen-dynamic w-full flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-5">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-purple-100" />
            <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-t-[3px] border-pink-400"
              style={{ animationDirection: 'reverse' }} />
          </div>
          <span className="text-lg font-medium text-gray-700">
            Loading 🌎 📘
          </span>
        </div>
      </div>
    )
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
  const passportDisplayName = searchParams.get('displayname');
  return (
    <>
      <div className="h-screen w-full bg-[#F5E6D3] flex flex-col">
        <div className="flex-1 overflow-hidden">
          {/* <PassportFlipBook locations={locations} /> */}
          <PassportFlipBook locations={locations}
            passportDisplayName={passportDisplayName ?? undefined} />
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