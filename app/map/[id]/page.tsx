"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useClerkSupabase } from "../../../components/utils/supabase";
import MapboxMapPublic from '@/components/PublicMap/MapBoxMapPublic'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface UserData {
  mappbook_user_id: string;
  display_name: string;
  is_premium_user: boolean;
  map_style: string;
  country_fill_color : string;
  map_views_left: number;
}

type UserDataContextType = UserData | null

export const UserDataContext = createContext<UserDataContextType>(null)

export default function MapPage() {
  const supabase = useClerkSupabase();
  const router = useRouter()
  const params = useParams()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [viewCountUpdated, setViewCountUpdated] = useState<boolean>(false)
  const [updateFailed, setUpdateFailed] = useState<boolean>(false)
  
  // Function to update map view counts in databse
  const updateViewCounts = async (mappbook_user_id: string) => {
    try {
      const { data, error: updateError } = await supabase
        .rpc('incrementtotalmapviews_decrementleftmapviews', { m_user_id: mappbook_user_id })

      if (updateError) {
        console.error('Error updating view counts:', updateError)
        setUpdateFailed(true)
        return false
      }

      // Update local state
      setUserData(prev =>
        prev ? {
          ...prev,
          map_views_left: prev.map_views_left - 1
        } : null
      )
      return true
    } catch (err) {
      console.error('Error in incrementtotalmapviews_decrementleftmapviews function :', err)
      setUpdateFailed(true)
      return false
    }
  }


  useEffect(() => {
    async function fetchUserData() {
      try {
        const userId = params.id

        // Validate UUID format
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId as string)

        if (!isValidUUID) {
          setError('Invalid URL format')
          setLoading(false)
          return
        }

        if (!userId) {
          setError('No user ID found in URL')
          setLoading(false)
          return
        }

        // Query Supabase for user data
        const { data, error: supabaseError } = await supabase
          .from('public_user_profile')
          .select('mappbook_user_id, display_name, is_premium_user, map_style, map_views_left, country_fill_color')
          .eq('mappbook_user_id', userId)
          .single()

        if (supabaseError) {
          throw supabaseError
        }

        if (!data) {
          setError('No user found')
          setLoading(false)
          return
        }

        setUserData(data as UserData)
      } catch (err) {
        setError('No user found')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [params.id])

  // Effect to update view counts when map is viewable
  useEffect(() => {
    // Early return if userData is null or undefined
    if (!userData) return;
    // const canViewMap = userData.is_premium_user && userData.map_views_left > 0
    const canViewMap = userData.map_views_left > 0;

    if (canViewMap && !viewCountUpdated) {
      updateViewCounts(userData.mappbook_user_id);
      setViewCountUpdated(true);
    }
  }, [userData, viewCountUpdated]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center space-y-8">
        {/* Logo Header */}
        <div className="text-center">
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

        {/* Alert Message */}
        <div className="w-full max-w-md px-4">
          <Alert variant="destructive" className="w-full">
            <AlertDescription>
              {'This user does not exist. Please check that you have the correct URL and try again.'}
            </AlertDescription>
          </Alert>
        </div>

        {/* Button */}
        <div className="w-full max-w-md px-4">
          <Button
            onClick={() => router.push('/')}
            className="w-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
              text-white hover:from-pink-500 hover:via-purple-500 hover:to-blue-500
              shadow-lg rounded-full px-6 py-3"
            size="lg"
          >
            Create Your MappBook
          </Button>
        </div>
      </div>
    )
  }

  //if the update views to database fails dont load map
  if (updateFailed) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center space-y-8">
        {/* Logo Header */}
        <div className="text-center">
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

        {/* Alert Message */}
        <div className="w-full max-w-md px-4">
          <Alert variant="destructive" className="w-full">
            <AlertDescription>
              Unable to load the MappBook at this time. Please try again later.
            </AlertDescription>
          </Alert>
        </div>

        {/* Button */}
        <div className="w-full max-w-md px-4">
          <Button
            onClick={() => router.push('/')}
            className="w-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
                text-white hover:from-pink-500 hover:via-purple-500 hover:to-blue-500
                shadow-lg rounded-full px-6 py-3"
            size="lg"
          >
            Create Your MappBook
          </Button>
        </div>
      </div>
    )
  }


  // const canViewMap = userData.is_premium_user && userData.map_views_left > 0
  const canViewMap = userData.map_views_left > 0
  // Return early if user can't view the map
  if (!canViewMap) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center space-y-8">
        {/* Logo Header */}
        <div className="text-center">
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

        {/* Alert Message */}
        <div className="w-full max-w-md px-4">
          <Alert className="w-full">
            <AlertDescription>
              This MappBook can't be displayed because the owner has reached their view limit.
            </AlertDescription>
          </Alert>
        </div>

        {/* Button */}
        <div className="w-full max-w-md px-4">
          <Button
            onClick={() => router.push('/')}
            className="w-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
                text-white hover:from-pink-500 hover:via-purple-500 hover:to-blue-500
                shadow-lg rounded-full px-6 py-3"
            size="lg"
          >
            Create Your MappBook
          </Button>
        </div>
      </div>
    )
  }

  // Only render the map and UI if canViewMap is true
  if(!updateFailed && canViewMap)
  return (
    <UserDataContext.Provider value={userData}>
      <main className="relative h-screen w-screen overflow-hidden">
        {/* Map Container */}
        <div className="h-full w-full">
          <MapboxMapPublic />
        </div>

        {/* Create Map Button */}
        <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 flex justify-center px-4">
          <Button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
            text-white hover:from-pink-500 hover:via-purple-500 hover:to-blue-500
            shadow-lg rounded-full px-6 py-3"
            size="lg"
          >
            Create Your MappBook
          </Button>
        </div>
      </main>
    </UserDataContext.Provider>
  )
}