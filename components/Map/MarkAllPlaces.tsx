import { AllUserPlacesContext } from '@/context/AllUserPlacesContext';
import { useUser } from '@clerk/nextjs';
import React, { useContext, useEffect, useState } from 'react';
import { Map, Marker, Popup } from 'react-map-gl';
import { supabase } from '../supabase';

function MarkAllPlaces() {

    //Use to add all user palces to Map
    const allUserPlacesContext = useContext(AllUserPlacesContext);
    const [userPlaces, setAllUserPlaces] = allUserPlacesContext
        ? [allUserPlacesContext.userPlaces, allUserPlacesContext.setAllUserPlaces]
        : [[], () => { }];


    const { isLoaded, isSignedIn, user } = useUser();

    useEffect(() => {
        if (isLoaded && isSignedIn && user?.id) {
            getAllUserPlaces(user.id);
        }
    }, [isLoaded, isSignedIn, user]);

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

    // to show pop up on click on place
    type Place = {
        place_name: string;
        place_full_address: string;
        place_longitude: number;
        place_latitude: number;
        place_country: string;
        visitedorwanttovisit: string;
    };

    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

    const handleMarkerClick = (place: Place) => {
        setSelectedPlace(place);
    };

    const handleMapClick = () => {
        // Close the popup if clicked outside
        if (selectedPlace) {
            setSelectedPlace(null);
        }
    };

    return (
        <div>
            {userPlaces && userPlaces.length > 0 ? (
                userPlaces.map((place) => (
                    <Marker
                        key={place.id} // Ensure each Marker has a unique key
                        longitude={place.place_longitude}
                        latitude={place.place_latitude}
                        anchor="top"
                    >
                        <div className="relative flex flex-col items-center" onClick={() => handleMarkerClick(place)}>
                            <img
                                src={place.visitedorwanttovisit === "visited" ? "./location.png" : "./pin.png"}
                                className="w-10 h-10"
                                alt="Marker"
                            />
                            <span
                                className={`mt-1 text-xs font-semibold px-2 py-1 rounded-md shadow-md ${place.visitedorwanttovisit === "visited"
                                        ? "text-gray-700 bg-green-200"     // Style for "visited"
                                        : "text-gray-700 bg-blue-200"      // Style for "want to visit"
                                    }`}
                            >
                                {place.place_name}
                            </span>
                        </div>

                        {selectedPlace && (
                            <Popup
                                longitude={selectedPlace.place_longitude}
                                latitude={selectedPlace.place_latitude}
                                anchor="bottom"
                                onClose={() => setSelectedPlace(null)}
                                closeOnClick={false} // Keeps popup open when clicking inside
                                closeButton={true}   // Close button in the popup
                            >
                                <div className="p-2 text-gray-800">
                                    <h3 className="font-bold text-lg">{selectedPlace.place_name}</h3>
                                    <p className="text-sm">{selectedPlace.place_full_address}</p>
                                    <p className="text-xs text-gray-600">
                                        Country: {selectedPlace.place_country}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        Status: {selectedPlace.visitedorwanttovisit === "visited" ? "Visited" : "Want to Visit"}
                                    </p>
                                </div>
                            </Popup>
                        )}
                    </Marker>
                ))
            ) : (
                <p>No places to display.</p> // Optional: Display a message if there are no places
            )}
        </div>
    );
}

export default MarkAllPlaces;
