import React, { ChangeEvent, useContext, useEffect, useState } from 'react';
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext';
import { AllUserPlacesContext } from "@/context/AllUserPlacesContext";
import { useMappbookUser } from '@/context/UserContext';
import { SignedIn, useClerk, useUser } from '@clerk/nextjs';
import SearchPlace from './SearchPlace';
import { BarChart, Check, Copy, MapPin, Navigation, Pencil, Share2, X } from 'lucide-react';
import { logout } from '../utils/auth';
import { Alert, AlertDescription } from '../ui/alert';
import { getClerkSupabaseClient } from "@/components/utils/supabase";
import posthog from 'posthog-js';
import router from 'next/router';
import { track } from '@vercel/analytics';

const famousPlaces = [
  {
    place_id: 'sample1',
    mapbox_id: 'sample1',
    place_name: 'Eiffel Tower',
    place_full_address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
    place_longitude: 2.2945,
    place_latitude: 48.8584,
    place_country: 'France',
    place_country_code: 'FR',
    place_language: 'fr',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'wanttovisit'
  },
  {
    place_id: 'sample2',
    mapbox_id: 'sample2',
    place_name: 'Taj Mahal',
    place_full_address: 'Agra, Uttar Pradesh, India',
    place_longitude: 78.0421,
    place_latitude: 27.1751,
    place_country: 'India',
    place_country_code: 'IN',
    place_language: 'hi',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'visited'
  },
  {
    place_id: 'sample3',
    mapbox_id: 'sample3',
    place_name: 'Machu Picchu',
    place_full_address: 'Cusco Region, Peru',
    place_longitude: -72.5450,
    place_latitude: -13.1631,
    place_country: 'Peru',
    place_country_code: 'PE',
    place_language: 'es',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'visited'
  },
  {
    place_id: 'sample4',
    mapbox_id: 'sample4',
    place_name: 'Great Wall of China',
    place_full_address: 'Mutianyu, Huairou District, Beijing, China',
    place_longitude: 116.0169,
    place_latitude: 40.4319,
    place_country: 'China',
    place_country_code: 'CN',
    place_language: 'zh',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'wanttovisit'
  },
  {
    place_id: 'sample5',
    mapbox_id: 'sample5',
    place_name: 'Santorini',
    place_full_address: 'Thira, South Aegean, Greece',
    place_longitude: 25.4615,
    place_latitude: 36.3932,
    place_country: 'Greece',
    place_country_code: 'GR',
    place_language: 'el',
    place_poi_category: 'island',
    visitedorwanttovisit: 'wanttovisit'
  },
  {
    place_id: 'sample6',
    mapbox_id: 'sample6',
    place_name: 'Petra',
    place_full_address: 'Ma\'an Governorate, Jordan',
    place_longitude: 35.4444,
    place_latitude: 30.3285,
    place_country: 'Jordan',
    place_country_code: 'JO',
    place_language: 'ar',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'wanttovisit'
  },
  {
    place_id: 'sample7',
    mapbox_id: 'sample7',
    place_name: 'Colosseum',
    place_full_address: 'Piazza del Colosseo, 1, 00184 Roma RM, Italy',
    place_longitude: 12.4924,
    place_latitude: 41.8902,
    place_country: 'Italy',
    place_country_code: 'IT',
    place_language: 'it',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'wanttovisit'
  },
  {
    place_id: 'sample8',
    mapbox_id: 'sample8',
    place_name: 'Statue of Liberty',
    place_full_address: 'New York, NY 10004, United States',
    place_longitude: -74.0445,
    place_latitude: 40.6892,
    place_country: 'United States',
    place_country_code: 'US',
    place_language: 'en',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'visited'
  },
  {
    place_id: 'sample9',
    mapbox_id: 'sample9',
    place_name: 'Sydney Opera House',
    place_full_address: 'Bennelong Point, Sydney NSW 2000, Australia',
    place_longitude: 151.2153,
    place_latitude: -33.8568,
    place_country: 'Australia',
    place_country_code: 'AU',
    place_language: 'en',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'visited'
  },
  {
    place_id: 'sample10',
    mapbox_id: 'sample10',
    place_name: 'Mount Fuji',
    place_full_address: 'Kitayama, Fujinomiya, Shizuoka 418-0112, Japan',
    place_longitude: 138.7274,
    place_latitude: 35.3606,
    place_country: 'Japan',
    place_country_code: 'JP',
    place_language: 'ja',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'wanttovisit'
  }
];

const mapStyles = [
  {
    id: 'satellite',
    imageSrc: '/mapstylesatellite.png',
    label: 'Satellite'
  },
  {
    id: 'light',
    imageSrc: '/mapstylelight.png',
    label: 'Light'
  },
  {
    id: 'dark',
    imageSrc: '/mapstyledark.png',
    label: 'Dark'
  },
];

const colorOptions = [
  {
    rgba: 'rgba(168,85,247,255)',
    label: 'Purple'
  },
  {
    rgba: 'rgba(236,72,153,255)',
    label: 'Pink'
  },
  {
    rgba: 'rgba(239,68,68,255)',
    label: 'Orange'
  },
  {
    rgba: 'rgba(249,115,21,255)',
    label: 'Yellow'
  },
  {
    rgba: 'rgba(34,197,93,255)',
    label: 'Green'
  }
];

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

interface UserPlace {
  place_id: number;
  place_name: string;
  place_full_address: string;
  place_longitude: number;
  place_latitude: number;
  place_country: string;
  place_country_code: string;
  place_language: string;
  place_poi_category?: string;
  visitedorwanttovisit: VisitStatus;
}

type VisitStatus = 'visited' | 'wanttovisit';

const AddPlace = () => {
  const supabase = getClerkSupabaseClient();
  const { isLoaded, isSignedIn, user } = useUser();
  const { mappbookUser, setMappbookUser } = useMappbookUser();
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [visitStatus, setVisitStatus] = useState<VisitStatus>('visited');
  const [enableAddPlaceButton, setEnableAddPlaceButton] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [showLink, setShowLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapStypeSelection, setMapStypeSelection] = useState<string>("satellite");
  const [selectedCountryFillColor, setSelectedCountryFillColor] = React.useState(colorOptions[0].rgba);
  const [placesAdded, setPlacesAdded] = useState(0);
  const searchedPlaceContext = useContext(SearchedPlaceDetailsContext);
  const { searchedPlace, setSearchedPlaceDetails } = searchedPlaceContext || {};
  const [copyText, setCopyText] = useState('Copy URL to share');

  const allUserPlacesContext = useContext(AllUserPlacesContext);
  const [userPlaces, setAllUserPlaces] = allUserPlacesContext
    ? [allUserPlacesContext.userPlaces, allUserPlacesContext.setAllUserPlaces]
    : [[], () => { }];

  useEffect(() => {
    if (isLoaded) {
      setIsLoading(false);
    }
  }, [isLoaded]);

  useEffect(() => {
    if (searchedPlace && Object.keys(searchedPlace).length > 0) {
      setEnableAddPlaceButton(true);
    } else {
      setEnableAddPlaceButton(false);
    }
  }, [searchedPlace]);

  const resetForm = () => {
    setVisitStatus('visited');
    setEnableAddPlaceButton(false);
    if (setSearchedPlaceDetails) {
      setSearchedPlaceDetails({} as PlaceDetails);
    }
  };
  useEffect(() => {
    if (mappbookUser) {
      setMapStypeSelection(mappbookUser.map_style);
      setSelectedCountryFillColor(mappbookUser.country_fill_color);
      setDisplayName(mappbookUser.display_name);
      setNameInput(mappbookUser.display_name);
    }
  }, [mappbookUser]);

  useEffect(() => {
    if (!isSignedIn && userPlaces.length === 0) {
      track('GREEN - New User Visited Create MappBook Page');
      setAllUserPlaces(famousPlaces);
    }
  }, [isSignedIn]);

  const onAddPlaceButtonClick = async () => {
    if (!searchedPlace) return;

    setIsSubmitting(true);

    if (!isSignedIn) {
      setSuccessMessage('Place marked! Sign in to save your progress, add more places and share! ✨');
      setPlacesAdded(prev => prev + 1);

      const newlySearchedPlace = {
        place_id: `sample${Date.now()}`,
        mapbox_id: searchedPlace.mapboxId,
        place_name: searchedPlace.name,
        place_full_address: searchedPlace.address,
        place_longitude: searchedPlace.longitude,
        place_latitude: searchedPlace.latitude,
        place_country: searchedPlace.country,
        place_country_code: searchedPlace.countryCode,
        place_language: searchedPlace.language,
        place_poi_category: searchedPlace.poiCategory,
        visitedorwanttovisit: visitStatus,
      };
      setAllUserPlaces([newlySearchedPlace]);
      resetForm();
      setIsSubmitting(false);
      track('GREEN - New user added a placeholder place');
      posthog.capture('GREEN - New user added a placeholder place', { property: '' });
      return;
    }

    // For authenticated users, proceed with normal flow
    const isSuccess = await addPlaceDetails();
    if (isSuccess) {
      setSuccessMessage('Place added successfully! 🎉');
      resetForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage('Failed to add place. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
    setIsSubmitting(false);
  };

  const addPlaceDetails = async () => {
    if (!searchedPlace || !user) return false;

    const newlySearchedPlace = {
      mappbook_user_id: mappbookUser?.mappbook_user_id,
      mapbox_id: searchedPlace.mapboxId,
      place_name: searchedPlace.name,
      place_full_address: searchedPlace.address,
      place_longitude: searchedPlace.longitude,
      place_latitude: searchedPlace.latitude,
      place_country: searchedPlace.country,
      place_country_code: searchedPlace.countryCode,
      place_language: searchedPlace.language,
      place_poi_category: searchedPlace.poiCategory,
      visitedorwanttovisit: visitStatus,
    };

    try {
      const { data, error } = await supabase
        .from('Mappbook_User_Places')
        .insert(newlySearchedPlace)
        .select();

      if (error) {
        console.error("Error adding Place to Supabase:", error);
        return false;
      }

      if (data?.[0]) {
        const newPlace = {
          place_id: data[0].place_id,
          mappbook_user_id: data[0].mappbook_user_id,
          place_name: data[0].place_name,
          place_full_address: data[0].place_full_address,
          place_longitude: data[0].place_longitude,
          place_latitude: data[0].place_latitude,
          place_country: data[0].place_country,
          place_country_code: data[0].place_country_code,
          place_language: data[0].place_language,
          place_poi_category: data[0].place_poi_category,
          visitedorwanttovisit: data[0].visitedorwanttovisit,
        };

        setAllUserPlaces(prevPlaces => [...(prevPlaces || []), newPlace]);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error adding Place to Supabase:", err);
      return false;
    }
  };

  const handleLogout = async () => {
    const { success, error } = await logout();
    if (!success) {
      console.error('Logout failed:', error);
    }
  };

  const handleShare = () => {
    setShowLink(!showLink);
    if (!showLink) {
      track('GREEN - Share button clicked');
    }
  };

  const handleCopy = async () => {
    try {
      track('GREEN - Copy share url button clicked');
      posthog.capture('GREEN - Copy share url button clicked', { property: '' });

      await navigator.clipboard.writeText(`https://mappbook.com/map/${mappbookUser?.mappbook_user_id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      track('GREEN - Copy share url button does not work');
      console.error('Failed to copy:', err);
    }
  };

  const startEditing = () => {
    setNameInput(displayName || '');
    setIsEditing(true);
  };

  const MAX_NAME_LENGTH = 20;
  const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .replace(/[<>&'"]/g, '')
      .slice(0, MAX_NAME_LENGTH);
  };

  const saveName = async () => {
    const sanitizedName = sanitizeInput(nameInput);

    if (!sanitizedName) {
      setError('Name cannot be empty');
      return;
    }

    if (sanitizedName.length > MAX_NAME_LENGTH) {
      setError(`Name must be ${MAX_NAME_LENGTH} characters or less`);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const saveSuccess = await saveNameToDb(sanitizedName);

      if (saveSuccess) {
        setDisplayName(sanitizedName);
        setIsEditing(false);
      } else {
        setError('Failed to save name. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error in saveName:', err);
    } finally {
      setSaving(false);
    }
  };

  const saveNameToDb = async (name: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('MappBook_Users')
        .update({ display_name: name })
        .eq('mappbook_user_id', mappbookUser?.mappbook_user_id)
        .single()

      if (error) {
        console.error('Error saving name:', error.message)
        return false
      }
      return true
    } catch (err) {
      console.error('Error saving name:', err)
      return false
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setNameInput('');
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNameInput(e.target.value);
  };

  const saveStyleToDb = async (style: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('MappBook_Users')
        .update({ map_style: style })
        .eq('mappbook_user_id', mappbookUser?.mappbook_user_id)
        .single();

      if (error) {
        console.error('Error saving style:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error saving style:', err);
      return false;
    }
  };

  const handleStyleSelect = async (style: string) => {
    setMapStypeSelection(style);
    await saveStyleToDb(style);
  };

  const saveCountryFillColorToDb = async (rgba: string): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('MappBook_Users')
        .update({ country_fill_color: rgba })
        .eq('mappbook_user_id', mappbookUser?.mappbook_user_id)
        .single();

      if (error) {
        console.error('Error saving color:', error.message);
        // setError('Failed to save color preference');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error saving color:', err);
      // setError('Failed to save color preference');
      return false;
    } finally {
      setSaving(false);
    }
  };
  const handleCountryFillColorSelect = async (colorRGBA: string) => {
    const selectedCountryFillColorOption = colorOptions.find(color => color.rgba === colorRGBA);
    if (!selectedCountryFillColorOption) return;

    setSelectedCountryFillColor(colorRGBA);
    const success = await saveCountryFillColorToDb(selectedCountryFillColorOption.rgba);

  };

  const handleShareToFriends = async () => {
    try {
      await navigator.clipboard.writeText("https://www.mappbook.com/map/43ff9fc7-43ca-425e-8da6-f5acb2ad529d");
      setCopyText('Copied!');
      track('URL Copied to share with friends');
      setTimeout(() => setCopyText('Copy URL to share'), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Early return if still loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          {/* <p className="text-purple-600 font-medium">Loading MappBook...</p> */}
        </div>
      </div>
    );
  }

  // Early return if mappbookUser is not loaded
  // if (!mappbookUser) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
  //       <div className="flex flex-col items-center gap-4">
  //         <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
  //         {/* <p className="text-purple-600 font-medium">Loading MappBook...</p> */}
  //       </div>
  //     </div>
  //   );
  // }

  const handlePremiumButtonClick = async () => {
    if (!user || !mappbookUser) {
      console.error('No user found to process premium payment');
      return;
    }
    setIsLoading(true);
    try {
      track('GREEN - Buy Premium button clicked');
      posthog.capture('GREEN - Buy Premium button clicked', { property: '' });

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: mappbookUser.mappbook_user_id,
          userEmail: user.emailAddresses[0].emailAddress,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        track('RED - Buy Premium failed', { user_is: mappbookUser.mappbook_user_id });
        posthog.capture('RED - Buy Premium failed', { user_is: mappbookUser.mappbook_user_id });

        throw new Error(error.message || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Error initiating checkout:', err);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-xl shadow-lg border border-pink-100/50 backdrop-blur-sm">
      {/* Logo Header */}
      <div className="p-4 text-center border-b border-pink-100/50 bg-white/50">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
          rounded-xl p-2 shadow-md transform -rotate-3">
            {/* <Map className="w-5 h-5 text-white" /> */}
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
          text-transparent bg-clip-text transform rotate-1">
            MappBook
          </h1>
        </div>
        <p className="text-xs font-medium text-purple-400">
          Share your World 🌎 Track your Adventures ✈️
        </p>
      </div>

      {isSignedIn && (<div className="p-4 border-b border-pink-100/50 bg-white/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 
            text-white flex items-center justify-center font-medium shadow-inner">
              {mappbookUser?.display_name?.[0].toUpperCase() || 'MappBook User'?.[0].toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-700">
                {displayName || 'MappBook User'}
              </span>
              <span className="text-xs text-purple-500 font-medium">
                {mappbookUser?.is_premium_user ? 'Premium Travel Creator' : 'Travel Creator'} ✈️
              </span>
            </div>
          </div>
          <button
            className="p-2 rounded-xl bg-white/80 text-purple-500 hover:bg-purple-50 
      transition-colors duration-300"
          >
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <BarChart className="w-4 h-4" />
                {!mappbookUser?.is_premium_user && (
                  <span className="text-sm font-medium">0 Mapp Views</span>
                )}
                {mappbookUser?.is_premium_user && (
                  <span className="text-sm font-medium">{mappbookUser.total_map_views} Mapp Views</span>
                )}
              </div>
              {/* {!mappbookUser?.is_premium_user && (
                <span className="text-[10px] text-purple-400/80 italic">✨ Premium feature</span>
              )} */}
            </div>
          </button>
        </div>

      </div>
      )}

      {/* Search Container */}
      <div className="p-6 space-y-6">
        {/* Search Component Wrapper */}
        <div className="bg-white/80 rounded-xl p-2 shadow-sm border border-pink-100">
          <SearchPlace />
        </div>

        {/* Visit Status Toggle */}

        <div className="flex gap-3">
          <button
            className={`flex-1 py-3 px-4 rounded-xl transition-all duration-300
            flex items-center justify-center gap-2 font-medium
            ${visitStatus === 'visited'
                ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg scale-105'
                : 'bg-white/80 text-gray-600 border border-pink-100 hover:bg-pink-50'
              }
            disabled:opacity-50 disabled:cursor-not-allowed transform`}
            onClick={() => setVisitStatus('visited')}
            disabled={!enableAddPlaceButton}
          >
            <MapPin className="w-4 h-4" />
            <span>Been Here</span>
          </button>
          <button
            className={`flex-1 py-3 px-4 rounded-xl transition-all duration-300
            flex items-center justify-center gap-2 font-medium
            ${visitStatus === 'wanttovisit'
                ? 'bg-gradient-to-r from-purple-400 to-blue-400 text-white shadow-lg scale-105'
                : 'bg-white/80 text-gray-600 border border-pink-100 hover:bg-purple-50'
              }
            disabled:opacity-50 disabled:cursor-not-allowed transform`}
            onClick={() => setVisitStatus('wanttovisit')}
            disabled={!enableAddPlaceButton}
          >
            <Navigation className="w-4 h-4" />
            <span>Bucket List</span>
          </button>
        </div>

        {/* Add Button */}
        <button
          className={`w-full py-3.5 px-4 rounded-xl font-medium text-base
          transition-all duration-300 
          flex items-center justify-center gap-2 transform
          ${enableAddPlaceButton
              ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 hover:from-pink-500 hover:to-blue-500 text-white shadow-lg hover:scale-[1.02]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          onClick={onAddPlaceButtonClick}
          disabled={!enableAddPlaceButton || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Adding to Your MappBook...</span>
            </>
          ) : (
            <>
              <MapPin className="w-5 h-5" />
              <span>Pin This Place 📍</span>
            </>
          )}
        </button>

        {/* Messages */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 text-green-600 
          flex items-center justify-center gap-2 border border-green-100 shadow-sm">
            <span className="text-xl">🎉</span>
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-pink-50 to-red-50 text-red-500 
          flex items-center justify-center gap-2 border border-pink-100 shadow-sm">
            <span className="text-xl">💫</span>
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Sign In Call to Action - Show after adding a place when not signed in */}
        {!isSignedIn && (
          <div className="space-y-4">
            <button
              onClick={async () => {
                try {
                  track('GREEN - New user tried to sign in');
                  posthog.capture('GREEN - New user tried to sign in', { property: '' });
                  await new Promise(resolve => setTimeout(resolve, 300));
                  window.location.href = '/sign-in';
                } catch (error) {
                  track('RED - New user sign in has issues');
                  window.location.href = '/sign-in';
                }
              }}
              className="w-full h-12 px-4 rounded-md
    bg-white text-gray-700 font-roboto font-medium
    border border-gray-200 
    hover:bg-gray-50 hover:shadow-md
    transform transition-all duration-300
    flex items-center justify-center gap-3"
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        )}

        <div className="text-center text-xs font-medium text-purple-400 space-x-2">
          <span>Need help? / Got suggestions? </span>

          <a href="/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-purple-500 transition-colors duration-300"
          >
            Send us a message
          </a>
        </div>

        <div className="text-center text-xs font-medium text-purple-400 space-x-2">
          <span>Love MappBook? Share with your friends! </span>
          <button
            onClick={handleShareToFriends}
            className="text-gray-500 hover:text-purple-500 transition-colors duration-300"
          >
            {copyText}
          </button>
        </div>


      </div>
      {/* New Bottom Section with Divider */}
      <div className="px-6 pb-6">
        {/* Decorative Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-pink-200/50"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 px-4">
              {/* <Sparkles className="w-5 h-5 text-purple-400" /> */}
            </span>
          </div>
        </div>



        {/* share button start */}



        <div className="space-y-3">
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="space-y-2">
              <div className="text-center text-sm font-medium bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Show it off!
              </div>
            </div>
          </div>
          <button
            onClick={handleShare}
            className="w-full py-3 px-4 rounded-xl font-medium
          bg-white/80 border border-pink-100 text-gray-700
          hover:bg-white hover:shadow-md transform transition-all duration-300
          flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5 text-purple-400" />
            <span>Share Your #MappBook</span>
          </button>

          {/* Share Link Section */}
          {showLink && !isSignedIn && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Name Section with Label */}
              <div className="space-y-2">
                <div className="text-center text-xs font-medium text-purple-400">
                  Sign in to share your MappBook
                </div>
              </div>
            </div>
          )}

          {showLink && isSignedIn && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Name Section with Label */}
              <div className="space-y-2">
                <div className="text-center text-xs font-medium text-purple-400">
                  Your MappBook title?
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  {isEditing ? (
                    <div className="space-y-2 max-w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="text"
                          value={nameInput}
                          onChange={handleNameChange}
                          placeholder="Enter your MappBook name"
                          maxLength={MAX_NAME_LENGTH}
                          className="flex-1 min-w-0 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          autoFocus
                        />
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={saveName}
                            disabled={isSaving}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSaving ? (
                              <span className="inline-block animate-spin">↻</span>
                            ) : (
                              <Check className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={isSaving}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className={error ? "text-red-500" : "text-gray-400"}>
                          {error || `${nameInput.length}/${MAX_NAME_LENGTH} characters`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">
                        {displayName || 'MappBook User'}
                      </span>
                      <button
                        onClick={startEditing}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-center text-xs font-medium text-purple-400">
                  Choose mapp style to share
                </div>
                <div className="flex justify-center items-center gap-2 overflow-x-auto pb-2 px-1">
                  {mapStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleStyleSelect(style.id)}
                      className={`
          relative flex-shrink-0 rounded-lg overflow-hidden
          aspect-square w-16 group transition-all duration-200
          ${mapStypeSelection === style.id
                          ? 'ring-2 ring-purple-500'
                          : 'hover:ring-2 hover:ring-gray-300'
                        }
        `}
                    >
                      <img
                        src={style.imageSrc}
                        alt={style.label}
                        className="w-full h-full object-cover"
                      />
                      {mapStypeSelection === style.id && (
                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                          <Check className="w-6 h-6 text-white drop-shadow-md" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/40 py-1">
                        <span className="text-xs text-white font-medium text-center block">
                          {style.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Country fill Color Selection Section */}

              <div className="text-center text-xs font-medium text-purple-400">
                Choose visited country fill color
              </div>
              <div className="flex justify-center items-center gap-3">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption.label}
                    onClick={() => handleCountryFillColorSelect(colorOption.rgba)}
                    disabled={isSaving}
                    className={`
                relative group 
                ${isSaving ? 'cursor-not-allowed opacity-50' : ''}
              `}
                    aria-label={`Select ${colorOption.label} color`}
                  >
                    <div
                      className={`
                  w-8 h-8 rounded-full 
                  transition-all duration-200
                  ${selectedCountryFillColor === colorOption.rgba ? 'scale-110 ring-2 ring-purple-400' : 'hover:scale-105'}
                `}
                      style={{ backgroundColor: colorOption.rgba }}
                    />
                    {selectedCountryFillColor === colorOption.rgba && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Share Link Section */}
              <div className="space-y-2">
                <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg">

                  <button
                    onClick={handleCopy}
                    className="w-full py-3 px-6 bg-purple-500 hover:bg-purple-600 
                  text-white rounded-lg flex items-center justify-center gap-2 
                  transition-colors duration-300 font-medium"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

              </div>



              <Alert className="bg-blue-50 border-blue-100">
                <AlertDescription className="text-sm text-blue-700">
                  Your MappBook can be viewed <b>{mappbookUser?.map_views_left} times by others</b>.
                  Need more? Add views anytime to keep sharing your journey!
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>



        {/* share button end */}

        {/* Premium button start */}
        {isSignedIn && (<button
          onClick={handlePremiumButtonClick}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-xl font-medium mt-6
        ${mappbookUser?.is_premium_user
              ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 text-white shadow-lg hover:scale-[1.02]'
              : 'bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 text-white shadow-lg hover:scale-[1.02]'
            }
        transform transition-all duration-300
        flex items-center justify-center gap-2 relative
        overflow-hidden group`}
        >
          <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors duration-300"></div>
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span className="font-semibold">
                {mappbookUser?.is_premium_user
                  ? `Add Views (${mappbookUser?.map_views_left} views left)`
                  : `Upgrade to Premium`}
              </span>
              {!mappbookUser?.is_premium_user && (
                <span className="bg-white/30 text-xs py-0.5 px-2 rounded-full ml-2">
                  50% OFF
                </span>
              )}
            </>
          )}
        </button>)}
        {/* Premium button end */}

        {/* Pro Features Preview */}
        {isSignedIn && (<div className="text-center mt-4">
          <div className="text-xs font-medium text-purple-400 flex items-center justify-center gap-2">
            <span>✨ Add Unlimited Places</span>
            <span>•</span>
            <span>🎨 Share your MappBook</span>
            <span>•</span>
            <span>📊 See Stats</span>
          </div>
        </div>)}



        <div className="mt-8 pt-4 border-t border-pink-100/50">
          <div className="flex items-center justify-center gap-4 text-xs">
            <a
              href="/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-purple-500 transition-colors duration-300"
            >
              Contact
            </a>
            <span className="text-gray-300">•</span>
            {isSignedIn ? (
              <button onClick={handleLogout} className="text-gray-500 hover:text-purple-500 transition-colors duration-300">
                Logout
              </button>
            ) : (
              <a href="/sign-in" className="text-gray-500 hover:text-purple-500 transition-colors duration-300">
                Sign In
              </a>
            )}
            <span className="text-gray-300">•</span>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-purple-500 transition-colors duration-300"
            >
              Terms
            </a>
            <span className="text-gray-300">•</span>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-purple-500 transition-colors duration-300"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>

    </div >
  );
};

export default AddPlace;