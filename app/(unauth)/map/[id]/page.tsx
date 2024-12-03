"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { supabase } from "@/components/utils/supabase"
import MapboxMapPublic from '@/components/PublicMap/MapBoxMapPublic'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserDataContext } from '@/context/UserDataContextPublicMap'
import { track } from '@vercel/analytics'

interface UserData {
  mappbook_user_id: string
  display_name: string
  is_premium_user: boolean
  map_style: string
  country_fill_color: string
  map_views_left: number
}

// Reusable components
const LogoHeader = () => (
  <div className="text-center">
    <div className="flex items-center justify-center gap-2 mb-1">
      <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
          rounded-xl p-2 shadow-md transform -rotate-3" />
      <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
          text-transparent bg-clip-text transform rotate-1">
        MappBook
      </h1>
    </div>
    <p className="text-xs font-medium text-purple-400">
      Share your World 🌎 Track your Adventures ✈️
    </p>
  </div>
)

const CreateMappBookButton = ({ isLoading, onClick }: { isLoading: boolean; onClick: () => void }) => (
  <Button
    onClick={onClick}
    className="w-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
              text-white hover:from-pink-500 hover:via-purple-500 hover:to-blue-500
              shadow-lg rounded-full px-6 py-3"
    size="lg"
    disabled={isLoading}
  >
    {isLoading ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </>
    ) : (
      'Create Your MappBook'
    )}
  </Button>
)

export default function MapPage() {
  const router = useRouter()
  const params = useParams()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [viewCountUpdated, setViewCountUpdated] = useState<boolean>(false)
  const [updateFailed, setUpdateFailed] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateMappBook = () => {
    setIsLoading(true)
    router.push('/')
  }

  const updateViewCounts = async (mappbook_user_id: string) => {
    try {
      const { data, error: updateError } = await supabase
        .rpc('update_map_views', { m_user_id: mappbook_user_id })

      if (updateError) {
        setUpdateFailed(true)
        track('RED - Failed to Update map views to DB on public MappBook', { user_is: mappbook_user_id })
        return false
      }

      setUserData(prev =>
        prev ? {
          ...prev,
          map_views_left: prev.map_views_left - 1
        } : null
      )
      return true
    } catch (err) {
      track('RED - Failed to Update map views to DB on public MappBook', { user_is: mappbook_user_id })
      setUpdateFailed(true)
      return false
    }
  }

  useEffect(() => {
    async function fetchUserData() {
      try {
        const userId = params.id

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

        const { data, error: supabaseError } = await supabase
          .from('public_user_profiles')
          .select('mappbook_user_id, display_name, is_premium_user, map_style, map_views_left, country_fill_color')
          .eq('mappbook_user_id', userId)
          .single()

        if (supabaseError) {
          track('RED - Failed to pull user data from DB on public MappBook')
          throw supabaseError
        }

        if (!data) {
          setError('No user found')
          setLoading(false)
          return
        }

        setUserData(data as UserData)
      } catch (err) {
        track('RED - Failed to pull user data from DB on public MappBook')
        setError('No user found')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [params.id])

  useEffect(() => {
    if (!userData) return
    const canViewMap = userData.map_views_left > 0

    if (canViewMap && !viewCountUpdated) {
      updateViewCounts(userData.mappbook_user_id)
      setViewCountUpdated(true)
    }
  }, [userData, viewCountUpdated])

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (error || !userData) {
    track('YELLOW - This user does not exist. Please check that you have the correct URL and try again')
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center space-y-8">
        <div className="p-4 text-center border-b border-pink-100/50 bg-white/50">
          <LogoHeader />
        </div>
        <div className="w-full max-w-md px-4">
          <Alert variant="destructive" className="w-full">
            <AlertDescription>
              This user does not exist. Please check that you have the correct URL and try again.
            </AlertDescription>
          </Alert>
        </div>
        <div className="w-full max-w-md px-4">
          <CreateMappBookButton isLoading={isLoading} onClick={handleCreateMappBook} />
        </div>
      </div>
    )
  }

  if (updateFailed) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center space-y-8">
        <LogoHeader />
        <div className="w-full max-w-md px-4">
          <Alert variant="destructive" className="w-full">
            <AlertDescription>
              Unable to load the MappBook at this time. Please refresh the page.
            </AlertDescription>
          </Alert>
        </div>
        <div className="w-full max-w-md px-4">
          <CreateMappBookButton isLoading={isLoading} onClick={handleCreateMappBook} />
        </div>
      </div>
    )
  }

  const canViewMap = userData.map_views_left > 0

  if (!canViewMap) {
    track('YELLOW - This MappBook cant be viewed because the owner has reached their view limit')
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center space-y-8">
        <LogoHeader />
        <div className="w-full max-w-md px-4">
          <Alert className="w-full">
            <AlertDescription>
              This MappBook can't be displayed because the owner has reached their view limit.
            </AlertDescription>
          </Alert>
        </div>
        <div className="w-full max-w-md px-4">
          <CreateMappBookButton isLoading={isLoading} onClick={handleCreateMappBook} />
        </div>
      </div>
    )
  }

  if (!updateFailed && canViewMap) {
    track('Public MappBook Viewed')
    return (
      <UserDataContext.Provider value={userData}>
        <main className="relative w-screen h-screen overflow-hidden">
          <div className="h-full w-full">
            <MapboxMapPublic />
          </div>
          <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 w-fit">
            <CreateMappBookButton isLoading={isLoading} onClick={handleCreateMappBook} />
          </div>
        </main>
      </UserDataContext.Provider>
    )
  }

  return null
}