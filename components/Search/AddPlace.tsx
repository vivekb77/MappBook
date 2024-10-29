import React, { useContext, useEffect, useState } from 'react';
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext';
import { AllUserPlacesContext } from "@/context/AllUserPlacesContext";
import { useUser } from '@clerk/nextjs';
import { supabase } from '../supabase';
import SearchPlace from './SearchPlace';
import { MapPin, Navigation } from 'lucide-react';

// Types remain the same
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
  // State management remains the same
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [visitStatus, setVisitStatus] = useState<VisitStatus>('visited');
  const [enableAddPlaceButton, setEnableAddPlaceButton] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLoaded, isSignedIn, user } = useUser();
  const [clerkUserId, setClerkUserId] = useState<string | null>(null);

  const searchedPlaceContext = useContext(SearchedPlaceDetailsContext);
  const { searchedPlace, setSearchedPlaceDetails } = searchedPlaceContext || {};

  const allUserPlacesContext = useContext(AllUserPlacesContext);
  const [userPlaces, setAllUserPlaces] = allUserPlacesContext
    ? [allUserPlacesContext.userPlaces, allUserPlacesContext.setAllUserPlaces]
    : [[], () => {}];

  // Effects and functions remain the same
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
    if (setSearchedPlaceDetails) {
      setSearchedPlaceDetails({} as PlaceDetails);
    }
  };

  const onAddPlaceButtonClick = async () => {
    if (!searchedPlace || !clerkUserId) return;
    
    setIsSubmitting(true);
    const isSuccess = await addPlaceDetails();
    
    if (isSuccess) {
      setSuccessMessage('Place added successfully! 🎉');
      resetForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage('Failed to add place. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
    setIsSubmitting(false);
  };

  const addPlaceDetails = async () => {
    // Implementation remains the same
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
    <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-xl shadow-lg border border-pink-100/50 backdrop-blur-sm">
    {/* Logo Header */}
    <div className="p-4 text-center border-b border-pink-100/50 bg-white/50">
      <div className="flex items-center justify-center gap-2 mb-1">
        <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
          rounded-xl p-2 shadow-md transform -rotate-3">
          {/* <Map className="w-5 h-5 text-white" /> */}
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
          text-transparent bg-clip-text transform rotate-1">
          MappBook
        </h1>
      </div>
      <p className="text-xs font-medium text-purple-400">
        Share Your World ✨ Track Your Adventures 🌎
      </p>
    </div>

    {/* User Header */}
    <div className="p-4 border-b border-pink-100/50 bg-white/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 
          text-white flex items-center justify-center font-medium shadow-inner">
          {user.firstName?.[0] || user.fullName?.[0]}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-700">
            {user.fullName}
          </span>
          <span className="text-xs text-purple-500 font-medium">
            Travel Creator ✈️
          </span>
        </div>
      </div>
    </div>

    {/* Search Container */}
    <div className="p-6 space-y-6">
      {/* Search Component Wrapper */}
      <div className="bg-white/80 rounded-xl p-2 shadow-sm border border-pink-100">
        <SearchPlace />
      </div>

      {/* Visit Status Toggle */}
      <div className="flex gap-3">
        <button
          className={`flex-1 py-3 px-4 rounded-xl transition-all duration-300
            flex items-center justify-center gap-2 font-medium
            ${visitStatus === 'visited'
              ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg scale-105'
              : 'bg-white/80 text-gray-600 border border-pink-100 hover:bg-pink-50'
            }
            disabled:opacity-50 disabled:cursor-not-allowed transform`}
          onClick={() => setVisitStatus('visited')}
          disabled={!enableAddPlaceButton}
        >
          <MapPin className="w-4 h-4" />
          <span>Been Here ✨</span>
        </button>
        <button
          className={`flex-1 py-3 px-4 rounded-xl transition-all duration-300
            flex items-center justify-center gap-2 font-medium
            ${visitStatus === 'wanttovisit'
              ? 'bg-gradient-to-r from-purple-400 to-blue-400 text-white shadow-lg scale-105'
              : 'bg-white/80 text-gray-600 border border-pink-100 hover:bg-purple-50'
            }
            disabled:opacity-50 disabled:cursor-not-allowed transform`}
          onClick={() => setVisitStatus('wanttovisit')}
          disabled={!enableAddPlaceButton}
        >
          <Navigation className="w-4 h-4" />
          <span>Bucket List 🌟</span>
        </button>
      </div>

      {/* Add Button */}
      <button
        className={`w-full py-3.5 px-4 rounded-xl font-medium text-base
          transition-all duration-300 
          flex items-center justify-center gap-2 transform
          ${enableAddPlaceButton
            ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 hover:from-pink-500 hover:to-blue-500 text-white shadow-lg hover:scale-[1.02]'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        onClick={onAddPlaceButtonClick}
        disabled={!enableAddPlaceButton || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Adding to Your Map...</span>
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5" />
            <span>Pin This Location 📍</span>
          </>
        )}
      </button>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 text-green-600 
          flex items-center justify-center gap-2 border border-green-100 shadow-sm">
          <span className="text-xl">🎉</span>
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-pink-50 to-red-50 text-red-500 
          flex items-center justify-center gap-2 border border-pink-100 shadow-sm">
          <span className="text-xl">💫</span>
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Engagement Hint */}
      <div className="text-center text-xs font-medium text-purple-400">
      Show the world where you have been 📸
      </div>
      
    </div>
      {/* New Bottom Section with Divider */}
      <div className="px-6 pb-6">
        {/* Decorative Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-pink-200/50"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 px-4">
              {/* <Sparkles className="w-5 h-5 text-purple-400" /> */}
            </span>
          </div>
        </div>

        {/* CTA Buttons Container */}
        <div className="space-y-3">
          {/* Pro Button */}
          <button
            className="w-full py-3 px-4 rounded-xl font-medium
              bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 
              text-white shadow-lg transform transition-all duration-300
              hover:scale-[1.02] hover:shadow-xl
              flex items-center justify-center gap-2 relative
              overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors duration-300"></div>
            {/* <Sparkles className="w-5 h-5" /> */}
            <span className="font-semibold">Upgrade to Pro</span>
            <span className="bg-white/30 text-xs py-0.5 px-2 rounded-full ml-2">
              50% OFF
            </span>
          </button>

          {/* Share Button */}
          <button
            // onClick={handleShare}
            className="w-full py-3 px-4 rounded-xl font-medium
              bg-white/80 border border-pink-100 text-gray-700
              hover:bg-white hover:shadow-md transform transition-all duration-300
              flex items-center justify-center gap-2"
          >
            {/* <Share2 className="w-5 h-5 text-purple-400" /> */}
            <span>Share Your Map</span>
          </button>

          {/* Pro Features Preview */}
          <div className="text-center mt-4">
            <div className="text-xs font-medium text-purple-400 flex items-center justify-center gap-2">
              <span>✨ Unlimited Places</span>
              <span>•</span>
              <span>🎨 Sharing to all</span>
              <span>•</span>
              <span>📊 Stats</span>
            </div>
          </div>
        </div>
      </div>
    
  </div>
  );
};

export default AddPlace;