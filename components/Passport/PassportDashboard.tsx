import { Video, Loader2, Download, Pencil, Check, X, Globe2 } from 'lucide-react'
import { useState, useEffect, useReducer } from 'react'
import { useUser } from '@clerk/nextjs'
import { useMappbookUser } from '@/context/UserContext'
import { getClerkSupabaseClient } from "@/components/utils/supabase"
import VideoHistory from './VideoHistory'
import DemoVideos from './DemoVideos'
import VisitedPlacesPopUp from './VisitedPlacesPopUp';
import { logout } from '../utils/auth'
import React from 'react'

interface Location {
  place_names: string[];
  place_country: string;
  place_country_code: string;
}

const MAX_NAME_LENGTH = 25;

interface ShareState {
  displayName: string | null;
  showLink: boolean;
  isEditing: boolean;
  nameInput: string;
  asyncState: {
    isSaving: boolean;
    error: string | null;
  };
}

type ShareAction =
  | { type: 'SET_DISPLAY_NAME'; payload: string }
  | { type: 'TOGGLE_SHARE' }
  | { type: 'START_EDITING' }
  | { type: 'CANCEL_EDITING' }
  | { type: 'SET_NAME_INPUT'; payload: string }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

interface RecordFlipbookResponse {
  success: boolean;
  video_url?: string;
  user_id?: string;
  error?: string;
}

interface PassportDashboardProps {
  onVideoUrlChange: (url: string | null) => void;
  onRecordingStart: () => void;
  onRecordingError: (error: string) => void;
}

interface NameEditorProps {
  displayName: string | null;
  isEditing: boolean;
  nameInput: string;
  isSaving: boolean;
  error: string | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onNameChange: (value: string) => void;
}

const NameEditor: React.FC<NameEditorProps> = ({
  displayName,
  isEditing,
  nameInput,
  isSaving,
  error,
  onEdit,
  onSave,
  onCancel,
  onNameChange,
}) => {
  if (!isEditing) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-gray-700">{displayName || 'MappBook User'}</span>
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Pencil className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={nameInput}
          onChange={(e) => onNameChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Enter your name"
          maxLength={MAX_NAME_LENGTH}
          disabled={isSaving}
        />
        <button
          onClick={onSave}
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
          onClick={onCancel}
          disabled={isSaving}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export function PassportDashboard({
  onVideoUrlChange,
  onRecordingStart,
  onRecordingError
}: PassportDashboardProps) {
  const supabase = getClerkSupabaseClient();
  const { isLoaded, isSignedIn, user } = useUser()
  const { mappbookUser, setMappbookUser } = useMappbookUser()
  const [passportDisplayName, setPassportDisplayName] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false)

  const [passportVideoCredits, setPassportVideoCredits] = useState<number | undefined>(undefined)
  const [isPassportVideoPremiumUser, setIPassportVideoPremiumUser] = useState<boolean>(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingSignIn, setIsLoadingSignIn] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])

  const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .replace(/[<>&'"]/g, '')
      .slice(0, MAX_NAME_LENGTH);
  };

  const handleLogout = async () => {
    const { success, error } = await logout();
    if (!success) {
      // track('RED - Create Map - Logout failed');
    }
  };

  const handleSignIn = async () => {
    setIsLoadingSignIn(true)
    try {
      window.location.href = '/sign-in'
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  useEffect(() => {
    if (mappbookUser) {
      setPassportDisplayName(mappbookUser.display_name);
      setIPassportVideoPremiumUser(mappbookUser.is_passport_video_premium_user)
      setPassportVideoCredits(mappbookUser.passport_video_credits)
      dispatch({ type: 'SET_DISPLAY_NAME', payload: mappbookUser.display_name });
    }
  }, [mappbookUser]);


  const shareReducer = (state: ShareState, action: ShareAction): ShareState => {
    switch (action.type) {
      case 'SET_DISPLAY_NAME':
        return { ...state, displayName: action.payload };
      case 'TOGGLE_SHARE':
        return { ...state, showLink: !state.showLink };
      case 'START_EDITING':
        return {
          ...state,
          isEditing: true,
          nameInput: state.displayName || '',
        };
      case 'CANCEL_EDITING':
        return {
          ...state,
          isEditing: false,
          nameInput: '',
          asyncState: { ...state.asyncState, error: null },
        };
      case 'SET_NAME_INPUT':
        return { ...state, nameInput: action.payload };
      case 'SET_SAVING':
        return {
          ...state,
          asyncState: { ...state.asyncState, isSaving: action.payload },
        };
      case 'SET_ERROR':
        return {
          ...state,
          asyncState: { ...state.asyncState, error: action.payload },
        };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(shareReducer, {
    displayName: mappbookUser?.display_name || null,
    showLink: false,
    isEditing: false,
    nameInput: '',
    asyncState: {
      isSaving: false,
      error: null,
    },
  });

  const fetchUserPlaces = async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('Mappbook_User_Places')
        .select('visitedorwanttovisit,place_country,place_country_code,isRemoved,place_name')
        .eq('mappbook_user_id', userId)
        .eq('visitedorwanttovisit', 'visited')
        .is('isRemoved', false);

      if (fetchError) throw new Error('Failed to fetch places');

      const countryGroups = data?.reduce((acc: { [key: string]: { places: string[], countryCode: string } }, place) => {
        if (place.place_name === place.place_country) return acc;
        if (!acc[place.place_country]) {
          acc[place.place_country] = { places: [], countryCode: place.place_country_code };
        }
        acc[place.place_country].places.push(place.place_name);
        return acc;
      }, {});

      const formattedLocations: Location[] = Object.entries(countryGroups || {})
        .map(([country, data]) => ({
          place_names: data.places,
          place_country: country,
          place_country_code: data.countryCode
        }))
        .sort((a, b) => b.place_names.length - a.place_names.length); // Sort by number of places in descending order


      setLocations(formattedLocations);
      return formattedLocations;
    } catch (err) {
      console.error('Error fetching places:', err);
      throw err;
    }
  };

  const triggerRecording = async () => {
    if (!isSignedIn || !mappbookUser) {
      const errorMsg = 'User must be signed in'
      setError(errorMsg)
      onRecordingError(errorMsg)
      return
    }

    let response: Response | undefined

    try {
      setIsRecording(true)
      setError(null)
      setVideoUrl(null)
      onVideoUrlChange(null)
      onRecordingStart()

      const userLocations = await fetchUserPlaces(mappbookUser.mappbook_user_id)
      console.log("Getting video for" + JSON.stringify(userLocations))

      response = await fetch('/api/call-lambdacc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationCount: userLocations.length,
          mappbook_user_id: mappbookUser.mappbook_user_id,
          passport_display_name: passportDisplayName,
          is_passport_video_premium_user: isPassportVideoPremiumUser
        }),
      })

      const data: RecordFlipbookResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to record video')
      }

      if (!data.video_url) {
        throw new Error('No video URL returned')
      }
      setPassportVideoCredits((prev) => (prev ?? 0) - 1)
      setVideoUrl(data.video_url)
      onVideoUrlChange(data.video_url)
    } catch (error: unknown) {
      let errorMessage = 'An error occurred while recording'

      if (error instanceof Error) {
        errorMessage = error.message
      }

      setError(errorMessage)
      onRecordingError(errorMessage)

      console.error('Full error details:', {
        error,
        responseStatus: response?.status,
        responseStatusText: response?.statusText
      })

      if (response) {
        try {
          const responseText = await response.text()
          console.error('Response text:', responseText)
        } catch (e) {
          console.error('Could not get response text')
        }
      }
    } finally {
      setIsRecording(false)
    }
  }

  const handleVideoSelect = (url: string) => {
    onVideoUrlChange(url);
  };

  if (isSignedIn && !mappbookUser) {
    return (
      <div className="h-screen-dynamic w-full flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-5">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-purple-100" />
            <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-t-[3px] border-pink-400"
              style={{ animationDirection: 'reverse' }} />
          </div>
          <span className="text-lg font-medium text-gray-700">
            Loading 🌎 📘
          </span>
        </div>
      </div>
    )
  }

  const saveName = async () => {
    const sanitizedName = sanitizeInput(state.nameInput);

    if (!sanitizedName) {
      dispatch({ type: 'SET_ERROR', payload: 'Name cannot be empty' });
      return;
    }

    if (!mappbookUser) {
      dispatch({ type: 'SET_ERROR', payload: 'User not found' });
      return;
    }

    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const { error } = await supabase
        .from('MappBook_Users')
        .update({ display_name: sanitizedName })
        .eq('mappbook_user_id', mappbookUser.mappbook_user_id)
        .single();

      if (error) throw error;
      setPassportDisplayName(sanitizedName)
      dispatch({ type: 'SET_DISPLAY_NAME', payload: sanitizedName });
      dispatch({ type: 'CANCEL_EDITING' });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to save name. Please try again.',
      });
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-xl shadow-lg border border-pink-100/50 backdrop-blur-sm flex flex-col min-h-full">
      {/* Main content wrapper with padding bottom for footer */}
      <div className="flex flex-col flex-1 pb-24"> {/* Added padding bottom for footer */}
        {/* Logo Header */}
        <div className="p-4 text-center border-b border-pink-100/50 bg-white/50">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-xl p-2 shadow-md transform -rotate-3">
              {/* <Map className="w-5 h-5 text-white" /> */}
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-transparent bg-clip-text transform rotate-1">
              MappBook
            </h1>
          </div>
          <p className="text-xs font-medium text-purple-400">
            Adventure Passport 🌎
          </p>
        </div>

        {/* User info section */}
        {isSignedIn && mappbookUser && (<div className="p-4 border-b border-pink-100/50 bg-white/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 
            text-white flex items-center justify-center font-medium shadow-inner">
                {passportDisplayName?.[0].toUpperCase() || 'MappBook User'?.[0].toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-700">
                  {passportDisplayName || 'MappBook User'}
                </span>
                <span className="text-xs text-purple-500 font-medium">
                  {mappbookUser.is_premium_user ? 'Premium Travel Creator' : 'Travel Creator'} ✈️
                </span>
              </div>
            </div>
          </div>

        </div>
        )}

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-6">
          <div className="text-left text-l font-bold text-purple-400">
                      Create an adventure Passport from all your visited Countries and Cities.
                    </div>
            <div className="space-y-4">
              {isSignedIn && mappbookUser ? (
                <>
                  <div className="space-y-4">

                    <div className="text-left text-xs font-medium text-purple-400">
                      Your Passport title? This will be printed on Front Cover.
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <NameEditor
                        displayName={state.displayName}
                        isEditing={state.isEditing}
                        nameInput={state.nameInput}
                        isSaving={state.asyncState.isSaving}
                        error={state.asyncState.error}
                        onEdit={() => dispatch({ type: 'START_EDITING' })}
                        onSave={saveName}
                        onCancel={() => dispatch({ type: 'CANCEL_EDITING' })}
                        onNameChange={(value) =>
                          dispatch({ type: 'SET_NAME_INPUT', payload: value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <VisitedPlacesPopUp
                      fetchUserPlaces={fetchUserPlaces}
                      userId={mappbookUser.mappbook_user_id}
                    />

                    <button
                      className="p-2 rounded-xl bg-white/80 text-purple-500 hover:bg-purple-50 transition-colors duration-300 disabled:opacity-50"
                      onClick={() => window.open('https://mappbook.com', '_blank')}
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2">
                          <Globe2 className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Add Places
                          </span>
                        </div>
                      </div>
                    </button>


                  </div>

                  <div className="text-left text-xs font-medium text-red-600">
                    {passportVideoCredits} Credits Remaining
                  </div>

                  {!isPassportVideoPremiumUser &&
                    <div className="text-left text-xs font-medium text-red-600">
                      Adventure Passport with only 3 countries will be created as free user. Add credits to generate Passport with all your visited Countries and Cities.
                    </div>
                  }

                  <button
                    onClick={triggerRecording}
                    disabled={isRecording || !passportVideoCredits || passportVideoCredits <= 0}
                    className="w-full h-12 px-4 rounded-md bg-white text-gray-700 font-medium border border-gray-200 hover:bg-gray-50 hover:shadow-md transform transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isRecording ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing Video...</span>
                      </>
                    ) : (
                      <>
                        <Video className="w-5 h-5" />
                        <span>Create Passport Video</span>
                      </>
                    )}
                  </button>

                  {mappbookUser && (
                    <VideoHistory
                      userId={mappbookUser.mappbook_user_id}
                      onVideoSelect={handleVideoSelect}
                    />
                  )}

                  <DemoVideos onVideoSelect={handleVideoSelect} />
                </>
              ) : (
                <div className="space-y-4">
                  <DemoVideos onVideoSelect={handleVideoSelect} />
                  <div className="p-4 rounded-md bg-purple-50 border border-purple-100">
                    <p className="text-sm text-purple-600 text-center font-medium">
                      These are demo Adventure Passport videos. Sign in to create your own with your visited Countries and Cities!
                    </p>
                  </div>

                  <button
                    onClick={handleSignIn}
                    disabled={isLoadingSignIn}
                    className="w-full h-12 px-4 rounded-md bg-white text-gray-700 font-roboto font-medium border border-gray-200 hover:bg-gray-50 hover:shadow-md transform transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoadingSignIn ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </button>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/100">
        <div className="px-6 pb-6">
          <div className="pt-4 border-t border-pink-100">
            <div className="flex items-center justify-center gap-4 text-xs">
              <a href="/contact" className="text-gray-500 hover:text-purple-500 transition-colors duration-300">
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
              <a href="/terms" className="text-gray-500 hover:text-purple-500 transition-colors duration-300">
                Terms
              </a>
              <span className="text-gray-300">•</span>
              <a href="/privacy" className="text-gray-500 hover:text-purple-500 transition-colors duration-300">
                Privacy
              </a>
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}
