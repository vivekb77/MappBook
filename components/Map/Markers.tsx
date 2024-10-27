
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext';
import React, { useContext } from 'react'
import { Map, Marker } from 'react-map-gl'

function Markers() {


  const { searchedPlace, setSearchedPlaceDetails }
    = useContext(SearchedPlaceDetailsContext);


  return (
    <div>
      {searchedPlace.length != 0 ? <Marker
        longitude={searchedPlace?.longitude}
        latitude={searchedPlace?.latitude}
        anchor="bottom" >
        <img src="./pin.png"
          className='w-10 h-10'
        />
      </Marker> : null}

    </div>
  )
}

export default Markers