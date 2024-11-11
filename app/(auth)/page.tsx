"use client"

import { useState, useEffect } from 'react'
import AddPlace from '@/components/Search/AddPlace'
import MapboxMap from '@/components/Map/MapBoxMap'
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext'
import { AllUserPlacesContext } from '@/context/AllUserPlacesContext'
import { MapStatsProvider } from '@/context/MapStatsContext'
import { MapPin, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [searchedPlace, setSearchedPlaceDetails] = useState<any>([])
  const [userPlaces, setAllUserPlaces] = useState<any[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { isLoaded, isSignedIn, user } = useUser()

    // Redirect to sign-in if not authenticated
    useEffect(() => {
      if (isLoaded && !isSignedIn) {
        router.push('/sign-in')
      }
    }, [isLoaded, isSignedIn, router])

    
  // Handle mobile viewport height
  useEffect(() => {
    const updateHeight = () => {
      // Get viewport height and set it as a CSS variable
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    // Initial calculation
    updateHeight()

    // Recalculate on resize and orientation change
    window.addEventListener('resize', updateHeight)
    window.addEventListener('orientationchange', updateHeight)

    return () => {
      window.removeEventListener('resize', updateHeight)
      window.removeEventListener('orientationchange', updateHeight)
    }
  }, [])

  const handleChevronClick = () => {
    setIsSheetOpen(!isSheetOpen)
  }

  // Loading state
  if (!isLoaded) return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="fixed inset-0" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <SearchedPlaceDetailsContext.Provider value={{ searchedPlace, setSearchedPlaceDetails }}>
        <AllUserPlacesContext.Provider value={{ userPlaces, setAllUserPlaces }}>
          <MapStatsProvider>
            <div className="flex h-full w-full relative">
              {/* Map Section */}
              <div className="flex-1 h-full w-full md:w-[70%]">
                <MapboxMap />
              </div>

              {/* Desktop Sidebar */}
              <div className="hidden md:block w-[30%] bg-white h-full">
                <div className="h-full p-4 overflow-y-auto">
                  <AddPlace />
                </div>
              </div>

              {/* Mobile Bottom Sheet */}
              <div
                className={`md:hidden fixed bottom-0 left-0 right-0 z-40 
                  transition-transform duration-300 ease-out bg-white
                  ${isSheetOpen ? 'translate-y-0' : 'translate-y-[100%]'}`}
                style={{ 
                  height: 'calc(var(--vh, 1vh) * 60)',
                  paddingBottom: 'env(safe-area-inset-bottom)'
                }}
              >
                {/* Chevron with location icon */}
                <div className="absolute -top-8 right-8 w-48 h-8 touch-none">
                  <svg width="100%" height="32" className="block shadow-lg">
                    <path 
                      d="M0,32 H192 C144,32 120,0 96,0 C72,0 48,32 0,32" 
                      fill="white" 
                      width="100%"
                    />
                  </svg>
                  <button 
                    className="absolute inset-0 flex items-center justify-center -mt-1 cursor-pointer"
                    onClick={handleChevronClick}
                    aria-label="Toggle places panel"
                  >
                    <MapPin className="w-6 h-6 text-gray-700 stroke-[2.5]" />
                  </button>
                </div>

                {/* Sheet Content */}
                <div className="h-full flex flex-col">
                  <div className="flex-1 min-h-0">
                    <div className="h-full px-4 pt-2 pb-4 overflow-y-auto overscroll-contain">
                      <AddPlace />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MapStatsProvider>
        </AllUserPlacesContext.Provider>
      </SearchedPlaceDetailsContext.Provider>
    </div>
  )
}