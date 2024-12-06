"use client"

import { useState, useRef, useEffect } from 'react'
import DashboardContainer from '@/components/Dashboard/DashboardContainer'
import MapboxMap from '@/components/Map/MapBoxMap'
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext'
import { AllUserPlacesContext } from '@/context/AllUserPlacesContext'
import { MapStatsProvider } from '@/context/MapStatsContext'
import { MapPin, ChevronUp, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

export default function Home() {
  const [searchedPlace, setSearchedPlaceDetails] = useState<any>([])
  const [userPlaces, setAllUserPlaces] = useState<any[]>([])
  const { isLoaded, isSignedIn, user } = useUser()
  
  const [isOpen, setIsOpen] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  const toggleSheet = () => setIsOpen(!isOpen)

  // Prevent automatic scroll adjustment on input focus
  useEffect(() => {
    const inputs = sheetRef.current?.querySelectorAll('input')
    inputs?.forEach(input => {
      input.addEventListener('focus', (e) => {
        e.preventDefault()
        input.focus({ preventScroll: true })
      })
    })
  }, [])

  if (!isLoaded) return (
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

  return (
    <div className="fixed inset-0 h-screen-dynamic overflow-hidden">
      <SearchedPlaceDetailsContext.Provider value={{ searchedPlace, setSearchedPlaceDetails }}>
        <AllUserPlacesContext.Provider value={{ userPlaces, setAllUserPlaces }}>
          <MapStatsProvider>
            <div className="flex h-full w-full relative">
              {/* Map Section */}
              <div className="flex-1 h-full w-full md:w-[67%] touch-none">
                <MapboxMap />
              </div>

              {/* Desktop Sidebar */}
              <div className="hidden md:block w-[33%] bg-white h-full">
                <div className="h-full p-4 overflow-y-auto">
                  <DashboardContainer />
                </div>
              </div>

              {/* Mobile Bottom Sheet */}
              <div
                ref={sheetRef}
                className="md:hidden fixed inset-x-0 z-50 
                  bg-white shadow-lg rounded-t-xl transform
                  transition-transform duration-300 ease-out"
                style={{
                  height: '60vh',
                  bottom: 0,
                  transform: `translateY(${isOpen ? '0' : '100%'})`
                }}
              >
                {/* Taller Tab Handle positioned higher */}
                <div 
                  className="absolute -top-16 left-1/2 -translate-x-1/2 w-[50%] max-w-md
                    bg-gradient-to-r from-pink-500 via-purple-500 to-purple-600
                    rounded-t-xl px-6 py-4 cursor-pointer shadow-lg
                    hover:scale-105 transition-all"
                  onClick={toggleSheet}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <MapPin className="w-8 h-8 text-white" />
                    <ChevronUp 
                      className={`w-8 h-8 text-white transition-transform duration-300
                        ${!isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="h-full overflow-y-auto overscroll-contain">
                  <div className="px-4 py-2">
                    <DashboardContainer />
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