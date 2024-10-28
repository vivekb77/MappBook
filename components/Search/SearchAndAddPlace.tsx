import React, { useContext } from 'react'
import AutocompleteAddress from './AutocompleteAddress'
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext';
import { useUser } from '@clerk/nextjs';
import { supabase } from '../supabase';
import MarkAllPlaces from "../Map/MarkAllPlaces";

function SearchPlace() {

  const { searchedPlace, setPlaceToAdd }
    = useContext(SearchedPlaceDetailsContext);

  //get user data from clerk
  const { isLoaded, isSignedIn, user } = useUser()
  if (!isLoaded || !isSignedIn) {
    return null
  }

  let clerkUserId = user.id;

  const onAddPlaceButtonClick = async () => {
    addPlaceDetails();
  }

  async function addPlaceDetails() {
    await supabase
      .from('Mappbook_User_Places')
      .insert({
        clerk_user_id: clerkUserId,
        place_name: searchedPlace.name,
        place_full_address: searchedPlace.address,
        place_longitude: searchedPlace.longitude,
        place_latitude: searchedPlace.latitude,
        place_country: searchedPlace.country,
        place_country_code: searchedPlace.countryCode,
        place_language: searchedPlace.language,
        place_poi_category: searchedPlace.poiCategory,
        visitedorwanttovisit: "visited",
        notes: "I fucking love this place"
      })
  }

  return (
    <div className="p-5 max-w-md mx-auto bg-gray-50 rounded-lg shadow-md">
      {/* Title */}
      <h4 className="text-sm font-semibold text-gray-800 text-center mb-4">
        Welcome {user.fullName}
      </h4>

      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">
        Search and Add a Place
      </h2>

      {/* Main Container */}
      <div className="border border-gray-300 bg-white p-6 rounded-lg shadow-sm">

        {/* Autocomplete Address */}
        <AutocompleteAddress />

        {/* Add Place Button */}
        <button
          className="bg-red-500 hover:bg-red-600 text-white w-full py-3 mt-4 rounded-md font-semibold text-lg 
                     shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300"
          onClick={() => { onAddPlaceButtonClick() }}>
          Add Place to Map
        </button>
        
      </div>
    </div>
  );
}

export default SearchPlace