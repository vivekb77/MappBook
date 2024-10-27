"use client"

import SearchPlace from '@/components/Search/SearchAndAddPlace'
import MapboxMap from '@/components/Map/MapBoxMap'
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext';

import Image from 'next/image'
import { useEffect, useState } from 'react';
export default function Home() {
  const [searchedPlace, setSearchedPlaceDetails] = useState<any>([]);

  return (
    <div className="min-h-screen p-5 bg-gray-50">
      <SearchedPlaceDetailsContext.Provider value={{ searchedPlace, setSearchedPlaceDetails }}>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 p-0 h-screen">

          {/* Map Container */}
          <div className="col-span-2 rounded-lg overflow-hidden bg-white h-full">
            <MapboxMap />
          </div>

          {/* Search Place Component */}
          <div className="rounded-lg bg-white h-full">
            <h3 className="text-xl font-semibold mb-3">Search for a Place</h3>
            <SearchPlace />
          </div>

        </div>


      </SearchedPlaceDetailsContext.Provider>
    </div>
  );

}
