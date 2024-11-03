import React, { ChangeEvent, useContext, useEffect, useState } from 'react';
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext';
import { AllUserPlacesContext } from "@/context/AllUserPlacesContext";
import { useClerk, useUser } from '@clerk/nextjs';
import { supabase } from '../utils/supabase';
import SearchPlace from './SearchPlace';
import { BarChart, Check, Copy, MapPin, Navigation, Pencil, Share2, X } from 'lucide-react';
import { logout } from '../utils/auth';
import { Alert, AlertDescription } from '../ui/alert';


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
    // rgba: 'rgba(79, 70, 229, 1)', old purple
    rgba: 'rgba(116, 117, 246, 1)',
    label: 'Purple'
  },
  {
    rgba: 'rgba(239, 130, 182, 1)',
    label: 'Pink'
  },
  {
    rgba: 'rgba(239, 108, 94, 1)',
    label: 'Orange'
  },
  {
    rgba: 'rgba(243, 156, 81, 1)',
    label: 'Yellow'
  },
  {
    rgba: 'rgba(115, 205, 114, 1)',
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
  id: number;
  clerk_user_id: string;
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
  // State management remains the same
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [visitStatus, setVisitStatus] = useState<VisitStatus>('visited');
  const [enableAddPlaceButton, setEnableAddPlaceButton] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [totalMapViews, setTotalMapViews] = useState(0);
  const [mapViewsLeft, setMapViewsLeft] = useState(0);
  const [clerkUserId, setClerkUserId] = useState<string | null>(null);
  const { isLoaded, isSignedIn, user } = useUser();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [mappBoxUserId, setMappBoxUserId] = useState<string | null>(null);
  const [showLink, setShowLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapStypeSelection, setMapStypeSelection] = useState<string>("satellite");
  const [selectedCountryFillColor, setSelectedCountryFillColor] = React.useState(colorOptions[0].rgba);

  const searchedPlaceContext = useContext(SearchedPlaceDetailsContext);
  const { searchedPlace, setSearchedPlaceDetails } = searchedPlaceContext || {};

  const allUserPlacesContext = useContext(AllUserPlacesContext);
  const [userPlaces, setAllUserPlaces] = allUserPlacesContext
    ? [allUserPlacesContext.userPlaces, allUserPlacesContext.setAllUserPlaces]
    : [[], () => { }];

  // Effects and functions remain the same
  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      setClerkUserId(user.id);
    }
  }, [isLoaded, isSignedIn, user]);

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
    const fetchUserData = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('MappBook_Users')
          .select('id,is_premium_user,total_map_views,map_views_left,display_name,map_style,country_fill_color')
          .eq('clerk_user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          return;
        }

        if (data) {
          setIsPremiumUser(data.is_premium_user);
          setTotalMapViews(data.total_map_views);
          setMapViewsLeft(data.map_views_left);
          setDisplayName(data.display_name || 'MappBook User');
          setMappBoxUserId(data.id);
          setMapStypeSelection(data.map_style)
          setSelectedCountryFillColor(data.country_fill_color)
        }
      }
    };

    fetchUserData();
  }, [user]);



  const onAddPlaceButtonClick = async () => {
    if (!searchedPlace || !clerkUserId) return;

    setIsSubmitting(true);
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
    // Implementation remains the same
    if (!searchedPlace || !clerkUserId) return false;

    const newlySearchedPlace = {
      clerk_user_id: clerkUserId,
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
          id: data[0].id,
          clerk_user_id: data[0].clerk_user_id,
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

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  const handleLogout = async () => {
    const { success, error } = await logout();
    if (!success) {
      console.error('Logout failed:', error);
    }
  };



  const handleShare = () => {
    setShowLink(!showLink); // Toggle the share section
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`https://mappbook.com/map/${mappBoxUserId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
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
      .replace(/[<>&'"]/g, '') // Remove potentially harmful characters
      .slice(0, MAX_NAME_LENGTH); // Ensure max length
  };

  const saveName = async () => {
    const sanitizedName = sanitizeInput(nameInput);

    // Validation checks
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
        .eq('id', mappBoxUserId)
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
        .eq('id', mappBoxUserId)
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
        .eq('id', mappBoxUserId)
        .single();

      if (error) {
        console.error('Error saving color:', error.message);
        // setError('Failed to save color preference');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error saving color:', err);
      // setError('An unexpected error occurred');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Handle color selection
  const handleCountryFillColorSelect = async (colorRGBA: string) => {
    const selectedCountryFillColorOption = colorOptions.find(color => color.rgba === colorRGBA);
    if (!selectedCountryFillColorOption) return;

    setSelectedCountryFillColor(colorRGBA);
    const success = await saveCountryFillColorToDb(selectedCountryFillColorOption.rgba);

    if (success) {
      // You might want to update your map or UI here
      // console.log(`Color ${selectedCountryFillColorOption.label} saved successfully`);
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
          Share Your World ✨ Track Your Adventures 🌎
        </p>
      </div>

      {/* Modified User Header with Stats Button */}
      <div className="p-4 border-b border-pink-100/50 bg-white/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 
            text-white flex items-center justify-center font-medium shadow-inner">
              {user.firstName?.[0] || user.fullName?.[0]}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-700">
                {user.fullName}
              </span>
              <span className="text-xs text-purple-500 font-medium">
                {isPremiumUser ? '✨ Premium Travel Creator' : 'Travel Creator'} ✈️
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
                {!isPremiumUser && (
                  <span className="text-sm font-medium">0 Mapp Views</span>
                )}
                {isPremiumUser && (
                  <span className="text-sm font-medium">{totalMapViews} Mapp Views</span>
                )}
              </div>
              {!isPremiumUser && (
                <span className="text-[10px] text-purple-400/80 italic">✨ Premium feature</span>
              )}
            </div>
          </button>
        </div>

      </div>

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
              <span>Adding to Your Map...</span>
            </>
          ) : (
            <>
              <MapPin className="w-5 h-5" />
              <span>Pin This Location 📍</span>
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

        {/* Engagement Hint */}
        <div className="text-center text-xs font-medium text-purple-400">
          Show the world where you have been 📸
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
          {/* Share Button */}
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

          {showLink && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Name Section with Label */}
              <div className="space-y-2">
                <div className="text-center text-xs font-medium text-purple-400">
                  Your MappBook title?
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={nameInput}
                          onChange={handleNameChange}
                          placeholder="Enter your mapp name"
                          maxLength={MAX_NAME_LENGTH}
                          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          autoFocus
                        />
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
                      <div className="flex justify-between text-xs">
                        <span className={error ? "text-red-500" : "text-gray-400"}>
                          {error || `${nameInput.length}/${MAX_NAME_LENGTH} characters`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">
                        {displayName || 'Untitled Map'}
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
                  Choose map style to share
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
                        <span>Copy Link ({mapViewsLeft} views left)</span>
                      </>
                    )}
                  </button>
                </div>

              </div>



              <Alert className="bg-blue-50 border-blue-100">
                <AlertDescription className="text-sm text-blue-700">
                  Others can view <b>{displayName || 'MappBook User'}'s MappBook</b> only if your account has available MappBook Views. 
                  You have <b>{mapViewsLeft} MappBook Views left.</b> Add more views using the Premium button. 
                  A view is counted when a user views your MappBook, and page refreshes also count as views. 
                  Use #MappBook when sharing.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>



        {/* share button end */}

        {/* Premium button start */}
        <button
          // disabled={isPremiumUser}
          className={`w-full py-3 px-4 rounded-xl font-medium mt-6
          ${isPremiumUser
              ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 text-white shadow-lg hover:scale-[1.02]'
              : 'bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 text-white shadow-lg hover:scale-[1.02]'
            }
          transform transition-all duration-300
          flex items-center justify-center gap-2 relative
          overflow-hidden group`}
        >
          <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors duration-300"></div>
          <span className="font-semibold">
            {isPremiumUser ? `Add Views (${mapViewsLeft} views left)` : `Upgrade to Premium`}
          </span>
          {!isPremiumUser && (
            <span className="bg-white/30 text-xs py-0.5 px-2 rounded-full ml-2">
              50% OFF
            </span>
          )}
        </button>
        {/* Premium button end */}

        {/* Pro Features Preview */}
        <div className="text-center mt-4">
          <div className="text-xs font-medium text-purple-400 flex items-center justify-center gap-2">
            <span>✨ Add Unlimited Places</span>
            <span>•</span>
            <span>🎨 Share your MappBook</span>
            <span>•</span>
            <span>📊 Stats</span>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-pink-100/50">
          <div className="flex items-center justify-center gap-4 text-xs">
            <a
              href="/"
              className="text-gray-500 hover:text-purple-500 transition-colors duration-300"
            >
              Support
            </a>
            <span className="text-gray-300">•</span>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-purple-500 transition-colors duration-300"
            >
              Logout
            </button>
            <span className="text-gray-300">•</span>
            <a
              href="/terms"
              className="text-gray-500 hover:text-purple-500 transition-colors duration-300"
            >
              Terms
            </a>
            <span className="text-gray-300">•</span>
            <a
              href="/privacy"
              className="text-gray-500 hover:text-purple-500 transition-colors duration-300"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AddPlace;