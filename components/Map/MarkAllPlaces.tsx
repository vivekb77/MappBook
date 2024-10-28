import { AllUserPlacesContext } from '@/context/AllUserPlacesContext';
import { useUser } from '@clerk/nextjs';
import React, { useContext, useEffect } from 'react';
import { Map, Marker } from 'react-map-gl';
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
