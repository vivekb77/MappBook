import { AllUserPlacesContext } from '@/context/AllUserPlacesContext';
import React, { useContext } from 'react';
import { Map, Marker } from 'react-map-gl';

function MarkAllPlaces() {
    const allUserPlacesContext = useContext(AllUserPlacesContext);

    const userPlaces = allUserPlacesContext?.userPlaces || [];
    const setAllUserPlaces = allUserPlacesContext?.setAllUserPlaces || (() => { });


    console.log("Marking all places " + userPlaces)

    return (
        <div>
            {userPlaces && userPlaces.length > 0 ? (
                userPlaces.map((place) => (
                    <Marker
                        key={place.id} // Ensure each Marker has a unique key
                        longitude={place.place_longitude}
                        latitude={place.place_latitude}
                        anchor="bottom"
                    >
                        <img src="./pin.png" className="w-10 h-10" alt="Marker" />
                    </Marker>
                ))
            ) : (
                <p>No places to display.</p> // Optional: Display a message if there are no places
            )}
        </div>
    );
}

export default MarkAllPlaces;
