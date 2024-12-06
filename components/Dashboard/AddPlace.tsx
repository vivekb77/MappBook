import React, { useContext, useState } from 'react';
import { Info, MapPin, Check } from 'lucide-react';
import { useMappbookUser } from '@/context/UserContext';
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext';
import { AllUserPlacesContext } from "@/context/AllUserPlacesContext";
import { useUser } from '@clerk/nextjs';
import { getClerkSupabaseClient } from "@/components/utils/supabase";
import { track } from '@vercel/analytics';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";


interface PlaceDetails {
    mapboxId: string;
    name: string;
    address: string;
    longitude: number;
    latitude: number;
    country: string;
    countryCode: string;
    language: string;
    poiCategory?: string;
}

type VisitStatus = 'visited' | 'wanttovisit';

interface Message {
    text: string;
    type: 'success' | 'error';
}

  

const AddPlace = () => {
    const supabase = getClerkSupabaseClient();
    const { isSignedIn, user } = useUser();
    const { mappbookUser } = useMappbookUser();
    const [message, setMessage] = useState<Message | null>(null);
    const [visitStatus, setVisitStatus] = useState<VisitStatus>('visited');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const searchedPlaceContext = useContext(SearchedPlaceDetailsContext);
    const { searchedPlace, setSearchedPlaceDetails } = searchedPlaceContext || {};
    const allUserPlacesContext = useContext(AllUserPlacesContext);
    const [userPlaces, setAllUserPlaces] = allUserPlacesContext
        ? [allUserPlacesContext.userPlaces, allUserPlacesContext.setAllUserPlaces]
        : [[], () => { }];

    const isPlaceSelected = searchedPlace && Object.keys(searchedPlace).length > 0;
    
    const TickIcon = () => (
        <span className="inline-flex bg-emerald-500 rounded-full p-0.5">
          <Check className="w-3 h-3 text-white stroke-[3]" aria-hidden="true" />
        </span>
      );

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    const resetForm = () => {
        setVisitStatus('visited');
        if (setSearchedPlaceDetails) {
            setSearchedPlaceDetails({} as PlaceDetails);
        }
    };

    const createPlaceObject = () => ({
        mappbook_user_id: mappbookUser?.mappbook_user_id,
        mapbox_id: searchedPlace?.mapboxId,
        place_name: searchedPlace?.name,
        place_full_address: searchedPlace?.address,
        place_longitude: searchedPlace?.longitude,
        place_latitude: searchedPlace?.latitude,
        place_country: searchedPlace?.country,
        place_country_code: searchedPlace?.countryCode,
        place_language: searchedPlace?.language,
        place_poi_category: searchedPlace?.poiCategory,
        visitedorwanttovisit: visitStatus,
    });

    const handleUnauthenticatedAdd = () => {
        const newPlace = {
            place_id: `sample${Date.now()}`,
            ...createPlaceObject()
        };
        setAllUserPlaces([newPlace]);
        showMessage('Place marked! Sign in to save your progress, add more places and share! ✨', 'success');
        track('Create Map - New user added a placeholder place');
    };

    const handleAuthenticatedAdd = async () => {
        try {
            const { data, error } = await supabase
                .from('Mappbook_User_Places')
                .insert(createPlaceObject())
                .select();

            if (error) throw error;

            if (data?.[0]) {
                const newPlace = {
                    place_id: data[0].place_id,
                    ...createPlaceObject()
                };
                setAllUserPlaces(prevPlaces => [...(prevPlaces || []), newPlace]);
                showMessage('Place added!', 'success');
                return true;
            }
            return false;
        } catch (err) {
            track('RED - Create Map - Failed to add place', { error: err instanceof Error ? err.message : String(err) });
            showMessage('Failed to add place. Please try again.', 'error');
            return false;
        }
    };

    const onAddPlaceButtonClick = async () => {
        if (!searchedPlace) return;

        setIsSubmitting(true);

        if (!isSignedIn) {
            handleUnauthenticatedAdd();
        } else {
            await handleAuthenticatedAdd();
        }

        resetForm();
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center bg-white/80 p-2.5 rounded-xl border border-pink-100">
                <div className="relative flex items-center justify-between w-full">
                    {/* Pill Toggle */}
                    <div
                        className={`
              relative h-[38px] rounded-full bg-gray-100
              flex items-center w-64 cursor-pointer select-none
              ${!isPlaceSelected ? 'opacity-50 cursor-not-allowed' : ''}
            `}
                        onClick={() => isPlaceSelected && setVisitStatus(visitStatus === 'visited' ? 'wanttovisit' : 'visited')}
                    >
                        {/* Labels Container */}
                        <div className="absolute inset-0 flex justify-between items-center z-10">
                            <div className="flex-1 flex justify-center items-center gap-1.5">
                                <span className={`text-sm font-medium transition-colors duration-150 ${visitStatus === 'visited' ? 'text-white' : 'text-gray-500'}`}>
                                    Been Here
                                </span>
                                {visitStatus === 'visited' && <TickIcon />}
                            </div>
                            <div className="flex-1 flex justify-center items-center gap-1.5">
                                <span className={`text-sm font-medium transition-colors duration-150 ${visitStatus === 'wanttovisit' ? 'text-white' : 'text-gray-500'}`}>
                                    Bucket List
                                </span>
                                {visitStatus === 'wanttovisit' && <TickIcon />}
                            </div>
                        </div>

                        {/* Sliding Background */}
                        <div
                            className={`
                absolute h-[34px] w-[49%] mx-[2px] rounded-full
                bg-gradient-to-r from-pink-400 to-purple-400
                transition-transform duration-150 ease-in-out shadow-md
                ${visitStatus === 'wanttovisit' ? 'translate-x-[100%]' : 'translate-x-0'}
              `}
                        />
                    </div>

                    {/* Info Button */}
                    <button
                        onClick={() => setIsInfoOpen(true)}
                        className="ml-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <Info className="w-5 h-5 text-purple-400" />
                    </button>

                    <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
                        <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] sm:w-[440px] rounded-2xl bg-gradient-to-br from-pink-100 to-purple-50 p-0 border-0">
                            <DialogHeader className="p-6 pb-0">
                                <DialogTitle className="text-xl font-semibold text-center bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                                    How it works
                                </DialogTitle>
                            </DialogHeader>

                            <div className="p-6 space-y-4">
                                <div className="bg-white/80 rounded-xl p-4 shadow-sm space-y-4">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm">
                                                <span className="font-medium text-purple-600">Been Here:</span>
                                                <span className="text-gray-600"> Mark places you've already visited. These locations will be:</span>
                                            </p>
                                            <ul className="text-sm text-gray-600 mt-2 space-y-2 ml-4">
                                                <li>• Added to your travel history</li>
                                                <li>• Displayed on your map with a blue visited pin</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="text-sm">
                                                <span className="font-medium text-purple-600">Bucket List:</span>
                                                <span className="text-gray-600"> Save places you dream of visiting. These locations will be:</span>
                                            </p>
                                            <ul className="text-sm text-gray-600 mt-2 space-y-2 ml-4">
                                                <li>• Added to your travel wishlist</li>
                                                <li>• Shown on your map with a red pin</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="bg-purple-50/50 rounded-lg p-3 text-sm text-purple-600">
                                        <p className="font-medium">Pro Tip 💫</p>
                                        <p className="mt-1 text-gray-600">
                                            You can always switch from "Been Here" to "Bucket List" or remove a place by clicking the pin on the Map. 
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>




            {/* Existing Add Button */}
            <button
                className={`w-full py-3.5 px-4 rounded-xl font-medium text-base
            transition-all duration-300 
            flex items-center justify-center gap-2 transform
            ${isPlaceSelected
                        ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 hover:from-pink-500 hover:to-blue-500 text-white shadow-lg hover:scale-[1.02]'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                onClick={onAddPlaceButtonClick}
                disabled={!isPlaceSelected || isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Adding...</span>
                    </>
                ) : (
                    <>
                        <span>Add This Place</span>
                        <MapPin className="w-5 h-5" />
                    </>
                )}
            </button>

            {/* Existing Message Display */}
            {message && (
                <div className={`p-4 rounded-xl 
            bg-gradient-to-r ${message.type === 'success'
                        ? 'from-green-50 to-blue-50 text-green-600 border-green-100'
                        : 'from-pink-50 to-red-50 text-red-500 border-pink-100'} 
            flex items-center justify-center gap-2 border shadow-sm`}>
                    <span className="text-xl">{message.type === 'success' ? '🎉' : '💫'}</span>
                    <span className="font-medium">{message.text}</span>
                </div>
            )}
        </div>
    );
};

export default AddPlace;