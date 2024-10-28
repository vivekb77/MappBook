"use client"

import AddPlace from '@/components/Search/AddPlace'
import MapboxMap from '@/components/Map/MapBoxMap'
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext';
import { AllUserPlacesContext } from '@/context/AllUserPlacesContext';

import Image from 'next/image'
import { useEffect, useState } from 'react';
export default function Home() {
  const [searchedPlace, setSearchedPlaceDetails] = useState<any>([]);
  const [userPlaces, setAllUserPlaces] = useState<any[]>([]);
  return (
    <div className="min-h-screen p-5 bg-gray-50">
      <SearchedPlaceDetailsContext.Provider value={{ searchedPlace, setSearchedPlaceDetails }}>
      <AllUserPlacesContext.Provider value={{ userPlaces, setAllUserPlaces }}>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 p-0 h-screen">

          {/* Map Container */}
          <div className="col-span-2 rounded-lg overflow-hidden bg-white h-full">
            <MapboxMap />
          </div>

          {/* Search Place Component */}
          <div className="rounded-lg bg-white h-full">
            <h3 className="text-xl font-semibold mb-3"></h3>
            <AddPlace />
          </div>

        </div>

        </AllUserPlacesContext.Provider>
      </SearchedPlaceDetailsContext.Provider>
    </div>
  );

}
