import React, { useContext, useEffect, useRef, useState } from "react";
import { Map, Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MarkSearchedPlace from "./MarkSearchedPlace";
import MarkAllPlaces from "./MarkAllPlaces";
import { SearchedPlaceDetailsContext } from "@/context/SearchedPlaceDetailsContext";

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
          // mapStyle="mapbox://styles/mapbox/light-v11"
          // mapStyle= "mapbox://styles/mapbox/dark-v11"
          // mapStyle="mapbox://styles/newsexpressnz/cm2oewdbb002p01pwb1epbr8l"
        >
          <MarkAllPlaces />
          <MarkSearchedPlace />
        </Map>
      </div>
    </div>
  );

}

export default MapboxMap;
