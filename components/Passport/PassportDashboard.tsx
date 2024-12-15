import { Video, Loader2, Download } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useMappbookUser } from '@/context/UserContext'
import { getClerkSupabaseClient } from "@/components/utils/supabase";
import VideoHistory from './VideoHistory'
import DemoVideos from './DemoVideos'
import { logout } from '../utils/auth';


interface Location {
  place_names: string[];
  place_country: string;
  place_country_code: string;
}

interface RecordFlipbookResponse {
  success: boolean;
  video_url?: string;
  user_id?: string;
  error?: string;
}


interface PassportDashboardProps {
  onVideoUrlChange: (url: string | null) => void
  onRecordingStart: () => void
  onRecordingError: (error: string) => void
}


export function PassportDashboard({
  onVideoUrlChange,
  onRecordingStart,
  onRecordingError
}: PassportDashboardProps) {
  const supabase = getClerkSupabaseClient();
  const { isLoaded, isSignedIn, user } = useUser()
  const { mappbookUser, setMappbookUser } = useMappbookUser()
  const [isRecording, setIsRecording] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingSignIn, setIsLoadingSignIn] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])


  const handleLogout = async () => {
    const { success, error } = await logout();
    if (!success) {
      // track('RED - Create Map - Logout failed');
    }
  };

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

      const formattedLocations: Location[] = Object.entries(countryGroups || {}).map(([country, data]) => ({
        place_names: data.places,
        place_country: country,
        place_country_code: data.countryCode
      }));

      setLocations(formattedLocations);
      return formattedLocations;
    } catch (err) {
      console.error('Error fetching places:', err);
      throw err;
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
      console.log(`Getting video for ${userLocations.length} locations`)

      response = await fetch('/api/call-lambda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationCount: userLocations.length,
          mappbook_user_id: mappbookUser.mappbook_user_id
        }),
      })

      const data: RecordFlipbookResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to record video')
      }

      if (!data.video_url) {
        throw new Error('No video URL returned')
      }

      setVideoUrl(data.video_url)
      onVideoUrlChange(data.video_url)
      console.log(videoUrl)
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

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (isSignedIn && !mappbookUser) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading user data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-xl shadow-lg border border-pink-100/50 backdrop-blur-sm flex flex-col h-full">
      <div className="flex-grow overflow-y-auto">
        {/* Logo Header */}
        <div className="p-4 text-center border-b border-pink-100/50 bg-white/50">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-xl p-2 shadow-md transform -rotate-3">
              <Video className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-transparent bg-clip-text transform rotate-1">
              MappBook
            </h1>
          </div>
          <p className="text-xs font-medium text-purple-400">
            Create your Adventure Passport 🎥
          </p>
        </div>

        {isSignedIn && (
          <div className="p-4 border-b border-pink-100/50 bg-white/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 text-white flex items-center justify-center font-medium shadow-inner">
                  {user?.firstName?.[0] || user?.emailAddresses[0].emailAddress[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-700">
                    {user?.firstName || user?.emailAddresses[0].emailAddress}
                  </span>
                  <span className="text-xs text-purple-500 font-medium">
                    Travel Creator ✈️
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {isSignedIn ? (
              <>
                <button
                  onClick={triggerRecording}
                  disabled={isRecording}
                  className="w-full h-12 px-4 rounded-md bg-white text-gray-700 font-medium border border-gray-200 hover:bg-gray-50 hover:shadow-md transform transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isRecording ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing video...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5" />
                      <span>Create Video</span>
                    </>
                  )}
                </button>

                {/* Add the VideoHistory component with onVideoSelect prop */}
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
                    Currently showing a demo video. Sign in to create your own!
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



      {/* Footer moved to the bottom */}
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