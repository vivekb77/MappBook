import React, { useContext, useEffect, useState } from 'react';
import { Map, Marker } from 'react-map-gl';
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext';
import { MapPin } from 'lucide-react';

// Types
interface PlaceDetails {
  longitude: number;
  latitude: number;
  mapboxId: string;
  name: string;
  address: string;
  country: string;
  countryCode: string;
  language: string;
  poiCategory?: string;
  maki?: string;
}

interface SearchedPlaceContextType {
  searchedPlace?: PlaceDetails;
  setSearchedPlaceDetails: (details: PlaceDetails) => void;
}

const MarkSearchedPlace = () => {
  const { searchedPlace } = useContext(SearchedPlaceDetailsContext) as SearchedPlaceContextType;
  const [isMarkerVisible, setIsMarkerVisible] = useState(false);

  // Add animation when marker appears
  useEffect(() => {
    if (searchedPlace && isValidCoordinates(searchedPlace)) {
      setIsMarkerVisible(true);
    } else {
      setIsMarkerVisible(false);
    }
  }, [searchedPlace]);

  // Validate coordinates
  const isValidCoordinates = (place: PlaceDetails | undefined): place is PlaceDetails => {
    if (!place) return false;

    return (
      typeof place.latitude === 'number' &&
      typeof place.longitude === 'number' &&
      !isNaN(place.latitude) &&
      !isNaN(place.longitude) &&
      Object.keys(place).length > 0 &&
      place.latitude !== 0 &&
      place.longitude !== 0
    );
  };

  // Return null if no valid place or coordinates
  if (!isValidCoordinates(searchedPlace)) {
    return null;
  }

  return (
    <div className="marker-container">
      <Marker
        longitude={searchedPlace.longitude}
        latitude={searchedPlace.latitude}
        anchor="bottom"
      >
        <div
          className={`
            relative flex flex-col items-center
            transform transition-all duration-300 ease-in-out
            ${isMarkerVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
          `}
        >
          {/* Marker Pin */}
          <div className="relative">
            <div className="absolute -inset-1 bg-yellow-500 rounded-full opacity-10 animate-pulse" />
            <img
              src={"searched.png"}
              className="w-7 h-7"
            />
          </div>

          {/* Location Label */}
          <div
            className="
              mt-2 px-3 py-1.5 
              bg-white rounded-lg shadow-lg
              transform-gpu transition-all duration-200
              hover:scale-105 hover:shadow-xl
            "
          >
            <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
              {searchedPlace.name}
            </span>
            <div className="absolute inset-x-0 font-bold text-xl text-gray-800 mb-1" />
          </div>

          {/* Ripple Effect */}
          {/* <div className="absolute -inset-2 pointer-events-none">
            <div className="absolute inset-0 border-1 border-green-500 rounded-full opacity-50 animate-ping" />
          </div> */}
        </div>
      </Marker>
    </div>
  );
};

export default React.memo(MarkSearchedPlace);