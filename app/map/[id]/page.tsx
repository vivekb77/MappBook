"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../components/utils/supabase'
import MapboxMapPublic from '@/components/PublicMap/MapBoxMapPublic'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface UserData {
  clerk_user_id: string
  id: string
  display_name: string
  is_premium_user: boolean
  map_style: string
  total_map_views: number
}

type UserDataContextType = UserData | null

export const UserDataContext = createContext<UserDataContextType>(null)

export default function MapPage() {
  const router = useRouter()
  const params = useParams()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

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
          .from('MappBook_Users')
          .select('id,clerk_user_id, display_name, is_premium_user, map_style, total_map_views')
          .eq('id', userId)
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
              {'No user exists. Please check the URL and try again.'}
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

  // Check if user can view the map
  const canViewMap = userData.is_premium_user && userData.total_map_views > 0

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
              This map view is restricted. The user needs to be premium and have available map views.
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
            className=" bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
            text-white hover:from-pink-500 hover:via-purple-500 hover:to-blue-500
            shadow-lg rounded-full px-6 py-3"
            // className="bg-white hover:bg-gray-50 text-black shadow-lg rounded-full px-6 py-3"
            size="lg"
          >
            Create Your MappBook
          </Button>
        </div>
      </main>
    </UserDataContext.Provider>
  )
}
