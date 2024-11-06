import React, { useEffect, useState, useMemo } from 'react';
import { Marker, Popup, Source, Layer, LayerProps, useMap } from 'react-map-gl';
import type { GeoJSON, Feature } from 'geojson';
import { supabase } from "@/components/utils/supabasenonauth";
import '../Map/popupstyles.css';

interface UserData {
  mappbook_user_id: string;
  display_name: string;
  is_premium_user: boolean;
  map_style: string;
  country_fill_color : string;
  map_views_left: number;
}

interface MarkAllPlacesProps {
  userData: UserData;
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

interface CountryFeatureProperties {
  ISO_A2?: string;
  isVisited?: boolean;
  [key: string]: any;
}

function MarkAllPlacesPublic({ userData }: MarkAllPlacesProps) {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countryData, setCountryData] = useState<GeoJSON | null>(null);
  const [userPlaces, setUserPlaces] = useState<Place[]>([]);
  const [zoom, setZoom] = useState<number>(1);
  const { current: map } = useMap();

  // Add zoom change listener
  useEffect(() => {
    if (!map) return;

    const onZoom = () => {
      setZoom(map.getZoom());
    };

    map.on('zoom', onZoom);
    // Set initial zoom
    setZoom(map.getZoom());

    return () => {
      map.off('zoom', onZoom);
    };
  }, [map]);

  // Fetch country GeoJSON data
  useEffect(() => {
    fetch('/countries.geojson')
      .then(response => response.json())
      .then((data: GeoJSON) => {
        if (data.type !== 'FeatureCollection') {
          throw new Error('Invalid GeoJSON format');
        }
        setCountryData(data);
      })
      .catch(error => {
        setError('Failed to load country data');
      });
  }, []);

  // Fetch user places
  useEffect(() => {
    if (userData.mappbook_user_id) {
      getAllUserPlaces(userData.mappbook_user_id);
    }
  }, [userData.mappbook_user_id]);

  async function getAllUserPlaces(mappbook_user_id: string) {
    try {
      const { data, error } = await supabase
        .from('Mappbook_User_Places')
        .select('place_id, mappbook_user_id, place_name, place_full_address, place_longitude, place_latitude, place_country, place_country_code, visitedorwanttovisit')
        .eq('mappbook_user_id', mappbook_user_id)
        .eq('isRemoved', false);

      if (error) {
        setError("Failed to fetch user's mappbook info");
        return;
      }
      if (data) {
        setUserPlaces(data as Place[]);
      }
    } catch (err) {
      setError("Failed to fetch user's mappbook info");
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

  // Create the country fill layer style with opacity based on zoom
  const countryFillLayer: LayerProps = {
    id: 'country-fills',
    type: 'fill',
    paint: {
      'fill-color': [
        'case',
        ['get', 'isVisited'],
        userData.country_fill_color,
        'rgba(200, 200, 200, 0.1)' //greyesh
      ],
      'fill-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        1, 1,  // At zoom level 1, opacity is 1
        6, 0   // At zoom level 6, opacity is 0
      ],
      'fill-outline-color': [
        'case',
        ['get', 'isVisited'],
        'rgba(7, 4, 77, 0.3)',
        'rgba(100, 100, 100, 0.2)'
      ]
    }
  };

  // Update GeoJSON features with visited status
  const geojsonData = useMemo(() => {
    if (!countryData || countryData.type !== 'FeatureCollection') return null;

    const updatedFeatures = countryData.features.map(feature => {
      const countryCode = ((feature.properties as CountryFeatureProperties)?.ISO_A2 || '').toLowerCase();
      
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
    };
  }, [countryData, visitedCountries]);

  // Rest of the component remains the same...
  return (
    <>
      {geojsonData && (
        <Source id="country-data" type="geojson" data={geojsonData}>
          <Layer {...countryFillLayer} />
        </Source>
      )}
      
      {userPlaces.map((place) => (
        <Marker
          key={place.place_id}
          longitude={place.place_longitude}
          latitude={place.place_latitude}
          anchor="top"
        >
          <div 
            className="relative flex flex-col items-center cursor-pointer transform transition-transform hover:scale-105"
            onClick={() => setSelectedPlace(place)}
          >
            <img
              src={place.visitedorwanttovisit === "visited" ? "/visited.png" : "/wanttovisit.png"}
              className="w-7 h-7"
              alt={`Marker for ${place.place_name}`}
            />
            <span
             className={`
              mt-1 text-[0.75rem] font-semibold px-2 py-1 rounded-md shadow-md
              ${place.visitedorwanttovisit === "visited"
                ? "text-gray-000 bg-blue-400 hover:bg-blue-500"
                : "text-gray-000 bg-red-400 hover:bg-red-500"}
              transition-colors duration-200
            `}
            >
              {place.place_name}
            </span>
          </div>

          {selectedPlace?.place_id === place.place_id && (
            <Popup
              longitude={selectedPlace.place_longitude}
              latitude={selectedPlace.place_latitude}
              anchor="bottom"
              onClose={() => setSelectedPlace(null)}
              closeOnClick={false}
              closeButton={true}
              closeOnMove={true}
              className="rounded-lg shadow-lg custom-popup z-50"
            >
              <div className="p-4 max-w-xs bg-white relative z-50">
                <div className="border-b border-gray-200 pb-3 mb-3">
                  <h3 className="font-bold text-sm text-gray-800 mb-1">
                    {selectedPlace.place_name}
                  </h3>
                  <p className="text-sm text-gray-600 leading-snug">
                    {selectedPlace.place_full_address}
                  </p>
                </div>
                
                <div className="space-y-2 mb-1">
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
                        flex items-center px-3 py-0 rounded-full text-sm font-medium
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
                      {selectedPlace.visitedorwanttovisit === "visited" ? "Visited" : "Bucket List"}
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          )}
        </Marker>
      ))}
      {/* {error && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[30%] z-50">
          <div className="mt-2 text-sm text-red-600 bg-white/90 px-3 py-1.5 rounded-md shadow-sm border border-red-100 animate-fade-in">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              {error}
            </div>
          </div>
        </div>
      )} */}
    </>
  );
}

export default MarkAllPlacesPublic;