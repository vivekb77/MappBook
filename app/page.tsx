"use client"

import SearchPlace from '@/components/Search/SearchAndAddPlace'
import MapboxMap from '@/components/Map/MapBoxMap'
import { SourceCordiContext } from '@/context/SourceCordiContext';

import Image from 'next/image'
import { useEffect, useState } from 'react';
export default function Home() {
  const [soruceCordinates, setSourceCordinates] = useState<any>([]);
  const [destinationCordinates, setDestinationCordinates] = useState<any>([]);
  const [directionData, setDirectionData] = useState<any>([]);


  return (
    <div className="min-h-screen p-5 bg-gray-50">
      <SourceCordiContext.Provider value={{ soruceCordinates, setSourceCordinates }}>

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


      </SourceCordiContext.Provider>
    </div>
  );

}
