import React, { useContext, useEffect, useState } from 'react';
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext';
import { AllUserPlacesContext } from "@/context/AllUserPlacesContext";
import { useUser } from '@clerk/nextjs';
import { supabase } from '../supabase';
import SearchPlace from './SearchPlace';

// Types
interface PlaceDetails {
  mapboxId: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  country: string;
  countryCode: string;
  language: string;
  poiCategory?: string;
}

interface UserPlace {
  id: number;
  clerk_user_id: string;
  place_name: string;
  place_full_address: string;
  place_longitude: number;
  place_latitude: number;
  place_country: string;
  place_country_code: string;
  place_language: string;
  place_poi_category?: string;
  visitedorwanttovisit: VisitStatus;
}

type VisitStatus = 'visited' | 'wanttovisit';

const AddPlace = () => {
  // State
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [visitStatus, setVisitStatus] = useState<VisitStatus>('visited');
  const [enableAddPlaceButton, setEnableAddPlaceButton] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth
  const { isLoaded, isSignedIn, user } = useUser();
  const [clerkUserId, setClerkUserId] = useState<string | null>(null);

  // Context
  const searchedPlaceContext = useContext(SearchedPlaceDetailsContext);
  const { searchedPlace, setSearchedPlaceDetails } = searchedPlaceContext || {};

  const allUserPlacesContext = useContext(AllUserPlacesContext);
  const [userPlaces, setAllUserPlaces] = allUserPlacesContext
    ? [allUserPlacesContext.userPlaces, allUserPlacesContext.setAllUserPlaces]
    : [[], () => {}];

  // Effects
  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      setClerkUserId(user.id);
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (searchedPlace && Object.keys(searchedPlace).length > 0) {
      setEnableAddPlaceButton(true);
    } else {
      setEnableAddPlaceButton(false);
    }
  }, [searchedPlace]);

  const resetForm = () => {
    setVisitStatus('visited');
    setEnableAddPlaceButton(false);
    // Clear the searched place by setting an empty object
    if (setSearchedPlaceDetails) {
      setSearchedPlaceDetails({} as PlaceDetails);
    }
  };

  const onAddPlaceButtonClick = async () => {
    if (!searchedPlace || !clerkUserId) return;
    
    setIsSubmitting(true);
    const isSuccess = await addPlaceDetails();
    
    if (isSuccess) {
      setSuccessMessage('Your place added successfully!');
      resetForm(); // Reset form on success
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } else {
      setErrorMessage('Failed to add!');
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    }
    setIsSubmitting(false);
  };

  const addPlaceDetails = async () => {
    if (!searchedPlace || !clerkUserId) return false;

    const newlySearchedPlace = {
      clerk_user_id: clerkUserId,
      mapbox_id: searchedPlace.mapboxId,
      place_name: searchedPlace.name,
      place_full_address: searchedPlace.address,
      place_longitude: searchedPlace.longitude,
      place_latitude: searchedPlace.latitude,
      place_country: searchedPlace.country,
      place_country_code: searchedPlace.countryCode,
      place_language: searchedPlace.language,
      place_poi_category: searchedPlace.poiCategory,
      visitedorwanttovisit: visitStatus,
    };

    try {
      const { data, error } = await supabase
        .from('Mappbook_User_Places')
        .insert(newlySearchedPlace)
        .select();

      if (error) {
        console.error("Error adding Place to Supabase:", error);
        return false;
      }

      if (data?.[0]) {
        const newPlace = {
          id: data[0].id,
          clerk_user_id: data[0].clerk_user_id,
          place_name: data[0].place_name,
          place_full_address: data[0].place_full_address,
          place_longitude: data[0].place_longitude,
          place_latitude: data[0].place_latitude,
          place_country: data[0].place_country,
          place_country_code: data[0].place_country_code,
          place_language: data[0].place_language,
          place_poi_category: data[0].place_poi_category,
          visitedorwanttovisit: data[0].visitedorwanttovisit,
        };
        
        setAllUserPlaces(prevPlaces => [...(prevPlaces || []), newPlace]);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error adding Place to Supabase:", err);
      return false;
    }
  };

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="p-5 max-w-md mx-auto bg-gray-50 rounded-lg shadow-md">
      {/* Welcome Header */}
      <h4 className="text-sm font-semibold text-gray-800 text-center mb-4">
        Welcome {user.fullName}
      </h4>

      {/* Main Container */}
      <div className="border border-gray-300 bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800 text-center mb-4">
          Search and Add a Place
        </h3>

        <SearchPlace />

        <div>
          {/* Visit Status Toggle */}
          <div className="flex justify-center my-4">
            <button
              className={`
                px-4 py-1 rounded-l-md transition-colors duration-200
                ${visitStatus === 'visited'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 text-gray-800'
                }
                disabled:opacity-50
              `}
              onClick={() => setVisitStatus('visited')}
              disabled={!enableAddPlaceButton}
            >
              Visited
            </button>
            <button
              className={`
                px-4 py-1 rounded-r-md transition-colors duration-200
                ${visitStatus === 'wanttovisit'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 text-gray-800'
                }
                disabled:opacity-50
              `}
              onClick={() => setVisitStatus('wanttovisit')}
              disabled={!enableAddPlaceButton}
            >
              Want to Visit
            </button>
          </div>

          {/* Add Place Button */}
          <button
            className={`
              w-full py-3 mt-3 rounded-md font-semibold text-lg 
              shadow-sm transition-all duration-200 
              focus:outline-none focus:ring-2 focus:ring-red-300
              ${enableAddPlaceButton
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }
            `}
            onClick={onAddPlaceButtonClick}
            disabled={!enableAddPlaceButton || isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding...
              </div>
            ) : (
              'Add Place to Map'
            )}
          </button>

          {/* Success Message */}
          {successMessage && (
            <div className="text-green-600 text-center my-2 py-2 px-4 bg-green-50 rounded-md">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="text-red-600 text-center my-2 py-2 px-4 bg-red-50 rounded-md">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPlace;