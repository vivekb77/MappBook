"use client"

import { useCallback, useEffect, useMemo, useState, memo } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from "@/components/utils/supabase"
import MapboxMapPublic from '@/components/PublicMap/MapBoxMapPublic'
import { Button } from '@/components/ui/button'
import { ChevronRight, Loader2, Plus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { track } from '@vercel/analytics'
import { UserData, UserDataContext } from '@/context/UserDataContextPublicMap';


interface State {
  userData: UserData | null
  loading: boolean
  error: string | null
  viewCountUpdated: boolean
  updateFailed: boolean
}

interface CreateMappBookButtonProps {
  isLoading: boolean
  onClick: () => void
}

type MapPageParams = {
  id: string
}

// Component Props Types
interface LogoHeaderProps { }
interface ErrorViewProps {
  message: string
  isLoading: boolean
  onCreateClick: () => void
}

// Utility function to validate map views
const isValidMapViews = (views: number | null | undefined): views is number => {
  return typeof views === 'number' && !isNaN(views)
}

// Reusable Components
const LogoHeader = memo<LogoHeaderProps>(() => (
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
))
LogoHeader.displayName = 'LogoHeader'

const CreateMappBookButton = memo<CreateMappBookButtonProps>(({ isLoading, onClick }) => (
  <Button
    onClick={onClick}
    className="group w-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
              text-white shadow-lg rounded-full px-6 py-3
              hover:from-pink-500 hover:via-purple-500 hover:to-blue-500
              hover:scale-[1.02] transition-all duration-300
              relative overflow-hidden"
    size="lg"
    disabled={isLoading}
  >
    <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors duration-300" />
    
    <div className="flex items-center justify-center gap-2">
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Creating...</span>
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          <span>Create Your MappBook</span>
          <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </>
      )}
    </div>
  </Button>
))

CreateMappBookButton.displayName = 'CreateMappBookButton'

const ErrorView = memo<ErrorViewProps>(({ message, isLoading, onCreateClick }) => (
  <div className="h-screen-dynamic w-full flex flex-col items-center justify-center space-y-8">
    <div className="p-4 text-center border-b border-pink-100/50 bg-white/50">
      <LogoHeader />
    </div>
    <div className="w-full max-w-md px-4">
      <Alert variant="destructive" className="w-full">
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
    <div className="w-full max-w-md px-4">
      <CreateMappBookButton isLoading={isLoading} onClick={onCreateClick} />
    </div>
  </div>
))
ErrorView.displayName = 'ErrorView'

// Custom hook for data fetching and state management
const useMapData = (userId: string | null) => {
  const [state, setState] = useState<State>({
    userData: null,
    loading: true,
    error: null,
    viewCountUpdated: false,
    updateFailed: false
  })

  const updateViewCounts = useCallback(async (mappbook_user_id: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .rpc('update_map_views', { m_user_id: mappbook_user_id })

      if (updateError) {
        setState(prev => ({ ...prev, updateFailed: true }))
        track('RED - Public MappBook - Failed to update MappBook views', {
          user_id: mappbook_user_id,
          error: updateError.message
        })
        return false
      }

      setState(prev => ({
        ...prev,
        userData: prev.userData ? {
          ...prev.userData,
          map_views_left: (prev.userData.map_views_left ?? 0) - 1
        } : null
      }))
      return true
    } catch (err) {
      track('RED - Public MappBook - Failed to update MappBook views', {
        user_id: mappbook_user_id,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
      setState(prev => ({ ...prev, updateFailed: true }))
      return false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function fetchUserData() {
      try {

        if (!userId) {
          setState(prev => ({ ...prev, error: 'No user ID found in URL', loading: false }))
          return
        }

        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)

        if (!isValidUUID) {
          setState(prev => ({ ...prev, error: 'Invalid URL format', loading: false }))
          return
        }

        const { data, error: supabaseError } = await supabase
          .from('public_user_profiles')
          .select('mappbook_user_id, display_name, is_premium_user, map_style, map_views_left, country_fill_color')
          .eq('mappbook_user_id', userId)
          .single()

        if (supabaseError) {
          throw supabaseError
        }

        if (!data) {
          setState(prev => ({ ...prev, error: 'No user found', loading: false }))
          return
        }

        if (mounted) {
          const userData = data as UserData
          setState(prev => ({ ...prev, userData }))

          if (isValidMapViews(userData.map_views_left) && userData.map_views_left > 0) {
            const success = await updateViewCounts(userData.mappbook_user_id)
            if (success && mounted) {
              setState(prev => ({ ...prev, viewCountUpdated: true }))
            }
          }
        }
      } catch (err) {
        if (mounted) {
          track('RED - Public MappBook - Failed to fetch user data', {
            error: err instanceof Error ? err.message : 'Unknown error'
          })
          setState(prev => ({ ...prev, error: 'No user found' }))
        }
      } finally {
        if (mounted) {
          setState(prev => ({ ...prev, loading: false }))
        }
      }
    }

    fetchUserData()

    return () => {
      mounted = false
    }
  }, [userId, updateViewCounts])

  return state
}

export default function MapPage() {
  const params = useParams<MapPageParams>()
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateMappBook = useCallback(async () => {
    try {
        setIsLoading(true);
        await Promise.all([
            Promise.resolve().then(() => {
                const newTab = document.createElement('a');
                newTab.href = '/';
                newTab.target = '_blank';
                newTab.rel = 'noopener noreferrer';
                newTab.click();
            }),
            Promise.resolve().then(() => {
                track('Public MappBook - Create MappBook button clicked');
            })
        ]);
    } catch (error) {
        console.error('Navigation failed:', error);
        track('RED - Public MappBook - Create MappBook button did not open url');
    } finally {
        setIsLoading(false);
    }
}, []);

  const { userData, loading, error, updateFailed } = useMapData(params?.id ?? null)

  const canViewMap = useMemo(() => {
    if (!userData) return false
    return isValidMapViews(userData.map_views_left) && userData.map_views_left > 0
  }, [userData])

  useEffect(() => {
    if (!updateFailed && canViewMap) {
      track('Public MappBook - MappBook viewed')
    }
  }, [updateFailed, canViewMap])

  if (loading) {
    return (
      <div className="h-screen-dynamic w-full flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-5">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-purple-100" />
            <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-t-[3px] border-pink-400"
              style={{ animationDirection: 'reverse' }} />
          </div>
          <span className="text-lg font-medium text-gray-700">
            Loading MappBook
          </span>
        </div>
      </div>
    )
  }

  if (error || !userData) {
    track('YELLOW - Public MappBook - This user does not exist. Please check that you have the correct URL and try again')
    return (
      <ErrorView
        message="This user does not exist. Please check that you have the correct URL and try again."
        isLoading={isLoading}
        onCreateClick={handleCreateMappBook}
      />
    )
  }

  if (updateFailed) {
    return (
      <ErrorView
        message="Unable to load the MappBook at this time. Please refresh the page."
        isLoading={isLoading}
        onCreateClick={handleCreateMappBook}
      />
    )
  }

  if (!canViewMap) {
    track('YELLOW - Public MappBook - This MappBook cant be viewed because the owner has reached their view limit')
    return (
      <ErrorView
        message="This MappBook can't be displayed because the owner has reached their view limit."
        isLoading={isLoading}
        onCreateClick={handleCreateMappBook}
      />
    )
  }

  return (
    <UserDataContext.Provider value={userData as UserData | null}>
      <main className="relative w-full h-screen-dynamic overflow-hidden">
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