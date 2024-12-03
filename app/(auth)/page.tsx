"use client"

import { useState } from 'react'
import AddPlace from '@/components/Search/AddPlace'
import MapboxMap from '@/components/Map/MapBoxMap'
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext'
import { AllUserPlacesContext } from '@/context/AllUserPlacesContext'
import { MapStatsProvider } from '@/context/MapStatsContext'
import { MapPin, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { track } from '@vercel/analytics'

export default function Home() {
  const router = useRouter()
  const [searchedPlace, setSearchedPlaceDetails] = useState<any>([])
  const [userPlaces, setAllUserPlaces] = useState<any[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { isLoaded, isSignedIn, user } = useUser()
  const [hasClicked, setHasClicked] = useState(false)

  const handleChevronClick = () => {
    if (!hasClicked) {
      track('Chevron button clicked')
    }
    setHasClicked(true)
    setIsSheetOpen(!isSheetOpen)
  }

  if (!isLoaded) return (
    <div className="viewport-height w-full flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="fixed inset-0 viewport-height">
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
                  transition-transform duration-300 ease-out bg-white h-[60%]
                  ${isSheetOpen ? 'translate-y-0' : 'translate-y-[100%]'}`}
                style={{
                  paddingBottom: 'env(safe-area-inset-bottom)',
                  height: 'calc(var(--vh, 1vh) * 60)' // 60% of viewport height
                }}
              >
                {/* Chevron with location icon */}
                <div className="absolute -top-12 right-16 touch-none w-[192px]">
                  <div
                    className="relative cursor-pointer"
                    onClick={handleChevronClick}
                  >
                    <svg width="100%" height="48" className="block shadow-xl">
                      <defs>
                        <linearGradient id="chevronGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{ stopColor: '#10B981' }} />
                          <stop offset="50%" style={{ stopColor: '#14B8A6' }} />
                          <stop offset="100%" style={{ stopColor: '#06B6D4' }} />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,48 H192 C144,48 120,0 96,0 C72,0 48,48 0,48"
                        fill="url(#chevronGradient)"
                      />
                    </svg>
                    <button
                      className={`absolute top-0 left-[96px] -translate-y-1/2 
                        flex items-center justify-center pointer-events-none
                        ${!hasClicked ? 'animate-bounce' : ''} group w-12 h-12`}
                      aria-label="Toggle places panel"
                    >
                      <MapPin
                        className="w-8 h-8 text-white stroke-[3] transform transition-transform 
                          group-hover:scale-110 group-hover:rotate-12"
                      />
                    </button>
                  </div>
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