import React, { useContext, useEffect, useState } from 'react';
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext';

// Types
interface Suggestion {
  name: string;
  full_address: string;
  mapbox_id: string;
}

interface SearchResult {
  suggestions: Suggestion[];
}

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

const SearchPlace = () => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<{
    name: string;
    fullAddress: string;
  } | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Context
  const { setSearchedPlaceDetails } = useContext(SearchedPlaceDetailsContext) as SearchedPlaceContextType;

  // Constants
  const SESSION_TOKEN = '5ccce4a4-ab0a-4a7c-943d-580e55542363'; // TODO: Generate dynamically
  const MAPBOX_RETRIEVE_URL = 'https://api.mapbox.com/search/searchbox/v1/retrieve/';
  const DEBOUNCE_DELAY = 1000;

  // Fetch suggestions when search query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          setIsSearching(true);
          setError(null);
          const suggestions = await fetchAddressSuggestions(searchQuery);
          setSuggestions(suggestions);
        } catch (err) {
          setError('Failed to fetch suggestions. Please try again.');
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Fetch address suggestions from API
  const fetchAddressSuggestions = async (query: string): Promise<Suggestion[]> => {
    const response = await fetch(`/api/search-address?q=${encodeURIComponent(query)}`, {
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch suggestions');
    }

    const result: SearchResult = await response.json();
    return result.suggestions || [];
  };

  // Handle selection of an address
  const handleAddressSelection = async (suggestion: Suggestion) => {
    try {
      setError(null);
      setSelectedPlace({
        name: suggestion.name,
        fullAddress: suggestion.full_address
      });
      setSuggestions([]);
      setSearchQuery('');

      const response = await fetch(
        `${MAPBOX_RETRIEVE_URL}${suggestion.mapbox_id}?session_token=${SESSION_TOKEN}&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch place details');
      }

      const result = await response.json();
      const feature = result.features[0];

      setSearchedPlaceDetails({
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
        mapboxId: feature.properties.mapbox_id,
        name: feature.properties.name,
        address: feature.properties.full_address,
        country: feature.properties.context.country.name,
        countryCode: feature.properties.context.country.country_code,
        language: feature.properties.language,
        poiCategory: feature.properties.poi_category,
        maki: feature.properties.maki,
      });
    } catch (err) {
      setError('Failed to fetch place details. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="relative">
        {/* Search Input */}
        <input
          type="text"
          id="searchField"
          className="w-full p-3 text-lg bg-white border border-gray-300 rounded-md shadow-sm 
                     text-gray-700 placeholder-gray-400 
                     focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent 
                     transition-colors duration-200"
          placeholder="Search for a place..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search for a place"
          autoComplete="off"
        />

        {/* Loading Indicator */}
        {isSearching && (
          <div className="absolute right-3 top-3">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-2 text-red-500 text-sm" role="alert">
            {error}
          </div>
        )}

        {/* Selected Place Display */}
        {selectedPlace && (
          <div className="mt-3 space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedPlace.name}
            </h2>
            <p className="text-sm text-gray-600">
              {selectedPlace.fullAddress}
            </p>
          </div>
        )}

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.mapbox_id}
                className="w-full p-3 text-left hover:bg-green-100 transition-colors duration-200
                         first:rounded-t-md last:rounded-b-md"
                onClick={() => handleAddressSelection(suggestion)}
              >
                <h3 className="font-medium text-gray-800">
                  {suggestion.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {suggestion.full_address}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPlace;