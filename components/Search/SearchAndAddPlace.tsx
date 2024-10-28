import React, { useContext, useEffect, useState } from 'react'
import AutocompleteAddress from './AutocompleteAddress'
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext';
import { useUser } from '@clerk/nextjs';
import { supabase } from '../supabase';
import MarkAllPlaces from "../Map/MarkAllPlaces";
import { AllUserPlacesContext } from "@/context/AllUserPlacesContext";

function SearchPlace() {

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [visitStatus, setVisitStatus] = useState('visited');
  const [enableAddPlaceButton, setEnableAddPlaceButton] = useState(false);

  const { searchedPlace, setPlaceToAdd }
    = useContext(SearchedPlaceDetailsContext);

  useEffect(() => {
    if (searchedPlace && Object.keys(searchedPlace).length > 0) {
      setEnableAddPlaceButton(true); // Enable if searchedPlace has valid data
    } else {
      setEnableAddPlaceButton(false); // Disable if searchedPlace is empty or invalid
    }
  }, [searchedPlace]);


  const allUserPlacesContext = useContext(AllUserPlacesContext);
  const [userPlaces, setAllUserPlaces] = allUserPlacesContext
    ? [allUserPlacesContext.userPlaces, allUserPlacesContext.setAllUserPlaces]
    : [[], () => { }];

  //get user data from clerk
  const { isLoaded, isSignedIn, user } = useUser()
  if (!isLoaded || !isSignedIn) {
    return null
  }

  let clerkUserId = user.id;

  const onAddPlaceButtonClick = async () => {
    const isSuccess = await addPlaceDetails();

    if (isSuccess) {
      setSuccessMessage('Your place added successfully!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
    if (!isSuccess) {
      setErrorMessage('Failed to add!');
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    }
  };


  async function addPlaceDetails() {

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
        .select()

      if (error) {
        console.error("Error adding Place to Supabase. Error is - ", error);
        return false;
      }

      //add the place to all placescontext to keep showing the pin to user even after next search rather than pulling all pins from DB after every new search
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
      setAllUserPlaces((prevPlaces) => [...(prevPlaces || []), newPlace]);


    } catch (err) {
      console.error("Error adding Place to Supabase. Error is - ", err);
      setEnableAddPlaceButton(false);
      setVisitStatus('visited')
    }
    setEnableAddPlaceButton(false);
    setVisitStatus('visited')
    return true;
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


        <div>

          <div className="flex justify-center my-4">
            <button
              className={`px-4 py-2 rounded-l-md ${visitStatus === 'visited' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setVisitStatus('visited')} disabled={!enableAddPlaceButton}
            >
              Visited
            </button>
            <button
              className={`px-4 py-2 rounded-r-md ${visitStatus === 'wanttovisit' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setVisitStatus('wanttovisit')} disabled={!enableAddPlaceButton}
            >
              Want to Visit
            </button>
          </div>

          <button
            className={`w-full py-3 mt-4 rounded-md font-semibold text-lg 
                shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 
                ${enableAddPlaceButton ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}
              `}
            onClick={() => { onAddPlaceButtonClick() }} disabled={!enableAddPlaceButton}>
            Add Place to Map
          </button>

          {successMessage && (
            <div className="text-green-600 text-center my-2">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="text-red-600 text-center my-2">
              {errorMessage}
            </div>
          )}
        </div>


      </div>
    </div>
  );
}

export default SearchPlace