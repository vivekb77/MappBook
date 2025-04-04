// import React, { forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react';
// import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext';
// import { useMappbookUser } from '@/context/UserContext';
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// import { MapStatsContext } from '@/context/MapStatsContext';
// import { track } from '@vercel/analytics';

// // Types
// interface Suggestion {
//   name: string;
//   full_address: string;
//   mapbox_id: string;
// }

// interface SearchResult {
//   suggestions: Suggestion[];
// }

// interface PlaceDetails {
//   longitude: number;
//   latitude: number;
//   mapboxId: string;
//   name: string;
//   address: string;
//   country: string;
//   countryCode: string;
//   language: string;
//   poiCategory?: string;
//   maki?: string;
// }
// export interface MapboxSearchPlaceRef {
//   reset: () => void;
// }
// interface SearchedPlaceContextType {
//   searchedPlace?: PlaceDetails;
//   setSearchedPlaceDetails: (details: PlaceDetails) => void;
// }
// const MapboxSearchPlace = forwardRef<MapboxSearchPlaceRef>((props, ref) => {
//   const { mappbookUser, setMappbookUser } = useMappbookUser();
//   const { allPlacesCount } = useContext(MapStatsContext);

//   // State
//   const [hasSearched, setHasSearched] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isSearching, setIsSearching] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedPlace, setSelectedPlace] = useState<{
//     name: string;
//     fullAddress: string;
//   } | null>(null);
//   const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
//   const [sessionToken, setSessionToken] = useState(() => crypto.randomUUID());

//   // Context
//   const { setSearchedPlaceDetails } = useContext(SearchedPlaceDetailsContext) as SearchedPlaceContextType;

//   // Constants
//   const MAPBOX_RETRIEVE_URL = 'https://api.mapbox.com/search/searchbox/v1/retrieve/';
//   const DEBOUNCE_DELAY = 1000;
//   const FREE_TIER_LIMIT = 100;
//   const PREMIUM_TIER_LIMIT = 500;

//   const isLoggedIn = !!mappbookUser;
//   const canSearch = isLoggedIn
//     ? (mappbookUser.is_premium_user && allPlacesCount < PREMIUM_TIER_LIMIT) ||
//     (!mappbookUser.is_premium_user && allPlacesCount < FREE_TIER_LIMIT)
//     : !hasSearched; // Allow search if user hasn't searched yet
    
//     useImperativeHandle(ref, () => ({
//       reset: () => {
//         setSelectedPlace(null);
//         setSearchQuery('');
//         setSuggestions([]);
//         setError(null);
//       }
//     }));

//   // Fetch suggestions when search query changes
//   useEffect(() => {
//     if (!canSearch) return;

//     const delayDebounceFn = setTimeout(async () => {
//       if (searchQuery.trim()) {
//         try {
//           setIsSearching(true);
//           setError(null);
//           const suggestions = await fetchAddressSuggestions(searchQuery);
//           setSuggestions(suggestions);
//         } catch (err) {
//           setError('Failed to fetch address suggestions.');
//           setSuggestions([]);
//         } finally {
//           setIsSearching(false);
//         }
//       } else {
//         setSuggestions([]);
//       }
//     }, DEBOUNCE_DELAY);

//     return () => clearTimeout(delayDebounceFn);
//   }, [searchQuery, canSearch]);

//   // Fetch address suggestions from API
//   const fetchAddressSuggestions = async (query: string): Promise<Suggestion[]> => {

//     const response = await fetch(`/api/search-address?q=${encodeURIComponent(query)}&session_token=${sessionToken}`, {
//       headers: { "Content-Type": "application/json" }
//     });

//     if (!response.ok) {
//       track('RED - Create Map - Failed to fetch address suggestions');
//       throw new Error('Failed to fetch address suggestions');
//     }

//     const result: SearchResult = await response.json();
//     return result.suggestions || [];
//   };

//   // Handle selection of an address
//   const handleAddressSelection = async (suggestion: Suggestion) => {

//     if (!canSearch) return;

//     try {
//       setError(null);
//       setSelectedPlace({
//         name: suggestion.name,
//         fullAddress: suggestion.full_address
//       });
//       setSuggestions([]);
//       setSearchQuery('');

//       const response = await fetch(
//         `${MAPBOX_RETRIEVE_URL}${suggestion.mapbox_id}?session_token=${sessionToken}&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_SEARCH_RETRIEVE}`
//       );

//       if (!response.ok) {
//         track('RED - Create map - Failed to fetch place details');
//         throw new Error('Failed to fetch place details');
//       }

//       const result = await response.json();
//       const feature = result.features[0];

//       setSearchedPlaceDetails({
//         longitude: feature.geometry.coordinates[0],
//         latitude: feature.geometry.coordinates[1],
//         mapboxId: feature.properties.mapbox_id,
//         name: feature.properties.name,
//         address: feature.properties.full_address,
//         country: feature.properties.context.country.name,
//         countryCode: feature.properties.context.country.country_code,
//         language: feature.properties.language,
//         poiCategory: feature.properties.poi_category,
//         maki: feature.properties.maki,
//       });
//       // Set hasSearched to true for non-signed-in users after successful search
//       if (!isLoggedIn) {
//         setHasSearched(true);
//       }
//     } catch (err) {
//       setError('Failed to fetch place details');
//     }
//   };

//   const getInputPlaceholder = () => {
//     // if (!isLoggedIn) return "Please log in to search";
//     // if (!canSearch) return `Upgrade to Premium to add more than ${FREE_TIER_LIMIT} places`;
//     if (!isLoggedIn && hasSearched) return "Sign in to search more places";
//     return "Search place...";
//   };

//   return (
// <div className="bg-white/80 rounded-xl p-2 shadow-sm border border-pink-100">
//     <div className="w-full max-w-md">
//       {isLoggedIn && !mappbookUser.is_premium_user && allPlacesCount >= FREE_TIER_LIMIT && (
//         <Alert>
//           <AlertDescription>
//             You've reached the limit of {FREE_TIER_LIMIT} places. Upgrade to Premium to add unlimited places and share your MappBook with others.
//           </AlertDescription>
//         </Alert>
//       )}

//       <div className="relative">
//         {/* Search Input */}
//         <input
//           type="text"
//           id="searchField"
//           className={`w-full p-3 text-lg bg-white border border-gray-300 rounded-md shadow-sm 
//                      text-gray-700 placeholder-gray-400 
//                      focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent 
//                      transition-colors duration-200
//                      ${!canSearch ? 'opacity-50 cursor-not-allowed' : ''}`}
//           placeholder={getInputPlaceholder()}
//           value={searchQuery}
//           onChange={(e) => canSearch && setSearchQuery(e.target.value)}
//           aria-label="Search place"
//           autoComplete="off"
//           maxLength={100}
//           disabled={!canSearch}
//         />

//         {/* Loading Indicator */}
//         {isSearching && canSearch && (
//           <div className="absolute right-3 top-3">
//             <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
//           </div>
//         )}

//         {/* Error Message */}
//         {error && canSearch && (
//           <div className="mt-2 text-red-500 text-sm" role="alert">
//             {error}
//           </div>
//         )}


//         {/* Suggestions Dropdown */}
//         {suggestions.length > 0 && canSearch && (
//           <div className="absolute left-0 right-0 z-20 bg-white border border-gray-200 rounded-md shadow-lg">
//             {suggestions.map((suggestion) => (
//               <button
//                 key={suggestion.mapbox_id}
//                 className="w-full p-3 text-left hover:bg-green-100 transition-colors duration-200
//                          first:rounded-t-md last:rounded-b-md"
//                 onClick={() => handleAddressSelection(suggestion)}
//               >
//                 <h3 className="font-medium text-gray-800">
//                   {suggestion.name}
//                 </h3>
//                 <p className="mt-1 text-sm text-gray-500">
//                   {suggestion.full_address}
//                 </p>
//               </button>
//             ))}
//           </div>
//         )}
// {selectedPlace && canSearch && (
//           <div className="mt-3 space-y-1">
//             <h2 className="text-lg font-semibold text-gray-900">
//               {selectedPlace.name}
//             </h2>
//             <p className="text-sm text-gray-600">
//               {selectedPlace.fullAddress}
//             </p>
//           </div>
//         )}

//       </div>
//     </div>
//     </div>
//   );

// });

// export default MapboxSearchPlace;