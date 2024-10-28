import React, { useContext, useEffect, useRef, useState } from "react";
import { Map, Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MarkSearchedPlace from "./MarkSearchedPlace";
import MarkAllPlaces from "./MarkAllPlaces";
import { supabase } from '../supabase';
import { useUser } from '@clerk/nextjs';
import { SearchedPlaceDetailsContext } from "@/context/SearchedPlaceDetailsContext";
import { AllUserPlacesContext } from "@/context/AllUserPlacesContext";

function MapboxMap() {
  const mapRef = useRef<any>();
  const { searchedPlace, setsoruceCordinates } = useContext(SearchedPlaceDetailsContext);


  //Use to Fly to Source Marker Location

  useEffect(() => {
    if (searchedPlace) {
      mapRef.current?.flyTo({
        center: [searchedPlace.longitude, searchedPlace.latitude],
        duration: 2000, // Adjusted duration for smoother transition
        zoom: 14, // Adjust the zoom level as needed
        curve: 1.5, // Increase curve for a more dynamic flight path
        easing: (t: number) => t * (2 - t), // Easing function for a more natural flight
      });
    }
  }, [searchedPlace]);


  //Use to add all user palces to Map
  const allUserPlacesContext = useContext(AllUserPlacesContext);
  const [userPlaces, setAllUserPlaces] = allUserPlacesContext
    ? [allUserPlacesContext.userPlaces, allUserPlacesContext.setAllUserPlaces]
    : [[], () => {}];

    
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      getAllUserPlaces(user.id);
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    // console.log("Data added to context ", userPlaces);
  }, [userPlaces]);

  async function getAllUserPlaces(userId: string) {
   try {
      const { data, error } = await supabase
        .from('Mappbook_User_Places')
        .select('id, clerk_user_id, place_name, place_full_address, place_longitude, place_latitude, place_country, place_country_code, visitedorwanttovisit')
        .eq('clerk_user_id', userId);

      if (error) {
        console.error("Error fetching places:", error);
      } else if (data) {
        setAllUserPlaces((prevPlaces) => [...(prevPlaces || []), ...data]);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  }



  return (
    
    <div className="p-5 bg-gray-50 min-h-screen flex flex-col items-center">
      {/* Optional Title */}
      {/* <h2 className="text-2xl font-semibold text-gray-800 mb-5">Map</h2> */}

      {/* Map Container */}
      <div className="w-full max-w-4xl rounded-lg shadow-lg overflow-hidden h-[50vh] md:h-[100vh]">
        <Map
          ref={mapRef}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
          initialViewState={{
            longitude: -114.370789, // Bitterroot Valley, USA
            latitude: 46.342303,
            zoom: 1,
          }}
          // style={{ width: "100%", height:"calc(100vh - 400px)" }} // done by h-[60vh] md:h-[100vh] in main div //adjust 300 for height on mobile devices

          mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        >
            <MarkAllPlaces/>
          <MarkSearchedPlace />
        </Map>
      </div>
    </div>
  );

}

export default MapboxMap;
