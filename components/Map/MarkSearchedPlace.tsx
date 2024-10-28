
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext';
import React, { useContext } from 'react'
import { Map, Marker } from 'react-map-gl'

function MarkSearchedPlace() {


  const { searchedPlace, setSearchedPlaceDetails }
    = useContext(SearchedPlaceDetailsContext);


  return (
    <div>
      {searchedPlace.length != 0 ? <Marker
        longitude={searchedPlace?.longitude}
        latitude={searchedPlace?.latitude}
        anchor="bottom" >
       <div className="relative flex flex-col items-center">
                            <img src="./pin.png" className="w-10 h-10" alt="Marker" />
                            <span className="mt-1 text-xs font-semibold text-gray-700 bg-white px-2 py-1 rounded-md shadow-md">
                                {searchedPlace.name}
                            </span>
                        </div>
      </Marker> : null}

    </div>
  )
}

export default MarkSearchedPlace