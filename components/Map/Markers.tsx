
import { SourceCordiContext } from '@/context/SourceCordiContext';
import React, { useContext } from 'react'
import { Map, Marker } from 'react-map-gl'

function Markers() {


  const { soruceCordinates, setSourceCordinates }
    = useContext(SourceCordiContext);


  return (
    <div>
      {soruceCordinates.length != 0 ? <Marker
        longitude={soruceCordinates?.lng}
        latitude={soruceCordinates?.lat}
        anchor="bottom" >
        <img src="./pin.png"
          className='w-15 h-15'
        />
      </Marker> : null}

    </div>
  )
}

export default Markers