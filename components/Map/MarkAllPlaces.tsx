import { AllUserPlacesContext } from '@/context/AllUserPlacesContext';
import { useUser } from '@clerk/nextjs';
import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Map, Marker, Popup, Source, Layer, FillLayer } from 'react-map-gl';
import type { GeoJSON } from 'geojson';
import { supabase } from '../supabase';

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

function MarkAllPlaces() {
  const allUserPlacesContext = useContext<AllUserPlacesContextType | null>(AllUserPlacesContext);
  const [userPlaces, setAllUserPlaces] = allUserPlacesContext
    ? [allUserPlacesContext.userPlaces, allUserPlacesContext.setAllUserPlaces]
    : [[] as Place[], () => {}];

  const { isLoaded, isSignedIn, user } = useUser();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countryData, setCountryData] = useState<GeoJSON | null>(null);

  // Fetch country GeoJSON data
  useEffect(() => {
    fetch('/countries.geojson')
      .then(response => response.json())
      .then((data: GeoJSON) => {
        // Ensure the data is in the correct format
        if (data.type !== 'FeatureCollection') {
          throw new Error('Invalid GeoJSON format');
        }
        setCountryData(data);
      })
      .catch(error => {
        console.error('Error loading country data:', error);
        setError('Failed to load country data');
      });
  }, []);

  // Fetch user places
  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      getAllUserPlaces(user.id);
    }
  }, [isLoaded, isSignedIn, user]);

  async function getAllUserPlaces(userId: string) {
    try {
      const { data, error } = await supabase
        .from('Mappbook_User_Places')
        .select('id, clerk_user_id, place_name, place_full_address, place_longitude, place_latitude, place_country, place_country_code, visitedorwanttovisit')
        .eq('clerk_user_id', userId)
        .eq('isRemoved', false);

      if (error) {
        console.error("Error fetching places:", error);
        setError("Failed to fetch places");
      } else if (data) {
        setAllUserPlaces(data);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred");
    }
  }

  // Create a list of visited countries using country codes
  const visitedCountries = useMemo(() => {
    return new Set(
      userPlaces
        .filter(place => place.visitedorwanttovisit === 'visited')
        .map(place => place.place_country_code.toLowerCase())
    );
  }, [userPlaces]);

  // Create the country fill layer style
  const countryFillLayer: FillLayer = {
    id: 'country-fills',
    type: 'fill',
    paint: {
      'fill-color': [
        'case',
        ['get', 'isVisited'],
        'rgba(10, 100, 233, 0.8)',  // Light green for visited countries
        'rgba(200, 200, 200, 0.1)'  // Very light gray for unvisited countries
      ],
      'fill-outline-color': [
        'case',
        ['get', 'isVisited'],
        'rgba(0, 0, 73, 1)',  // Darker green for visited country borders
        'rgba(100, 100, 100, 0.2)'  // Gray for unvisited country borders
      ]
    }
  };

  // Add a line layer for country borders
  const countryBorderLayer = {
    id: 'country-borders',
    type: 'line' as const,
    paint: {
      'line-color': [
        'case',
        ['get', 'isVisited'],
        'rgba(0, 128, 0, 0.5)',  // Darker green for visited country borders
        'rgba(100, 100, 100, 0.2)'  // Gray for unvisited country borders
      ],
      'line-width': 1
    }
  };

  // Update GeoJSON features with visited status
  const geojsonData = useMemo(() => {
    if (!countryData || countryData.type !== 'FeatureCollection') return null;

    const updatedFeatures = countryData.features.map(feature => {
      // Get the country code from properties (assuming it exists in your GeoJSON)
      const countryCode = (feature.properties?.ISO_A2 || '').toLowerCase();
      
      return {
        ...feature,
        properties: {
          ...feature.properties,
          isVisited: visitedCountries.has(countryCode)
        }
      };
    });

    return {
      type: 'FeatureCollection' as const,
      features: updatedFeatures
    } as GeoJSON;
  }, [countryData, visitedCountries]);

  const handleMarkerClick = (place: Place) => {
    setSelectedPlace(place);
  };

  async function markAsVisited(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('Mappbook_User_Places')
        .update({ visitedorwanttovisit: "visited" })
        .eq('id', id);

      if (error) {
        console.error("Error marking as visited:", error);
        setError("Failed to mark place as visited");
      } else {
        setAllUserPlaces((prevPlaces) => 
          prevPlaces.map((place) => 
            place.id === id ? { ...place, visitedorwanttovisit: "visited" } : place
          )
        );
        setSelectedPlace((prev) => (prev ? { ...prev, visitedorwanttovisit: "visited" } : prev));
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred");
    }
  }

  async function removePlace(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('Mappbook_User_Places')
        .update({ isRemoved: true })
        .eq('id', id);

      if (error) {
        console.error("Error removing place:", error);
        setError("Failed to remove place");
      } else {
        setAllUserPlaces((prevPlaces) => prevPlaces.filter((place) => place.id !== id));
        setSelectedPlace(null);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred");
    }
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <>
    // @ts-ignore
      {geojsonData && (
        <Source id="country-data" type="geojson" data={geojsonData}>
          <Layer {...countryFillLayer} />
          {/* <Layer {...countryBorderLayer} /> */}
        </Source>
      )}
      
      {userPlaces.map((place) => (
        <Marker
          key={place.id}
          longitude={place.place_longitude}
          latitude={place.place_latitude}
          anchor="top"
        >
          <div 
            className="relative flex flex-col items-center cursor-pointer transform transition-transform hover:scale-105"
            onClick={() => handleMarkerClick(place)}
          >
            <img
              src={place.visitedorwanttovisit === "visited" ? "/location.png" : "/pin.png"}
              className="w-10 h-10"
              alt={`Marker for ${place.place_name}`}
            />
            <span
              className={`
                mt-1 text-xs font-semibold px-2 py-1 rounded-md shadow-md
                ${place.visitedorwanttovisit === "visited"
                  ? "text-gray-700 bg-green-200 hover:bg-green-300"
                  : "text-gray-700 bg-blue-200 hover:bg-blue-300"}
                transition-colors duration-200
              `}
            >
              {place.place_name}
            </span>
          </div>

          {selectedPlace?.id === place.id && (
           <Popup
           longitude={selectedPlace.place_longitude}
           latitude={selectedPlace.place_latitude}
           anchor="bottom"
           onClose={() => setSelectedPlace(null)}
           closeOnClick={false}
           closeButton={true}
           className="rounded-lg shadow-lg"
         >
           <div className="p-4 max-w-xs">
             {/* Header */}
             <div className="border-b border-gray-200 pb-3 mb-3">
               <h3 className="font-bold text-xl text-gray-800 mb-1">
                 {selectedPlace.place_name}
               </h3>
               <p className="text-sm text-gray-600 leading-snug">
                 {selectedPlace.place_full_address}
               </p>
             </div>
         
             {/* Info Section */}
             <div className="space-y-2 mb-4">
               <div className="flex items-center text-gray-600">
                 <svg
                   className="w-4 h-4 mr-2"
                   fill="none"
                   strokeWidth="2"
                   stroke="currentColor"
                   viewBox="0 0 24 24"
                 >
                   <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
                   />
                 </svg>
                 <span className="text-sm font-medium">
                   {selectedPlace.place_country}
                 </span>
               </div>
         
               <div className="flex items-center">
                 <div
                   className={`
                     flex items-center px-3 py-1 rounded-full text-sm font-medium
                     ${selectedPlace.visitedorwanttovisit === "visited"
                       ? "bg-green-100 text-green-800"
                       : "bg-blue-100 text-blue-800"
                     }
                   `}
                 >
                   <svg
                     className={`w-4 h-4 mr-1.5 ${
                       selectedPlace.visitedorwanttovisit === "visited"
                         ? "text-green-600"
                         : "text-blue-600"
                     }`}
                     fill="none"
                     strokeWidth="2"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                   >
                     {selectedPlace.visitedorwanttovisit === "visited" ? (
                       <path
                         strokeLinecap="round"
                         strokeLinejoin="round"
                         d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                       />
                     ) : (
                       <path
                         strokeLinecap="round"
                         strokeLinejoin="round"
                         d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                       />
                     )}
                   </svg>
                   {selectedPlace.visitedorwanttovisit === "visited" ? "Visited" : "Want to Visit"}
                 </div>
               </div>
             </div>
         
             {/* Action Buttons */}
             <div className="flex gap-2 pt-2 border-t border-gray-200">
               {selectedPlace.visitedorwanttovisit === "wanttovisit" && (
                 <button
                   className="flex-1 flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 
                              text-white py-2 px-4 rounded-lg transition duration-200 ease-in-out
                              shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                   onClick={() => markAsVisited(selectedPlace.id)}
                 >
                   <svg
                     className="w-4 h-4"
                     fill="none"
                     strokeWidth="2"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                   >
                     <path
                       strokeLinecap="round"
                       strokeLinejoin="round"
                       d="M5 13l4 4L19 7"
                     />
                   </svg>
                   Mark Visited
                 </button>
               )}
               <button
                 className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 
                            text-white py-2 px-4 rounded-lg transition duration-200 ease-in-out
                            shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                 onClick={() => removePlace(selectedPlace.id)}
               >
                 <svg
                   className="w-4 h-4"
                   fill="none"
                   strokeWidth="2"
                   stroke="currentColor"
                   viewBox="0 0 24 24"
                 >
                   <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                   />
                 </svg>
                 Remove
               </button>
             </div>
           </div>
         </Popup>
          )}
        </Marker>
      ))}
    </>
  );
}

export default MarkAllPlaces;