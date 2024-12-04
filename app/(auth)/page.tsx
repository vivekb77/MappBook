"use client"

import { useState, useRef, useEffect } from 'react'
import AddPlace from '@/components/Search/AddPlace'
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
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  const toggleSheet = () => setIsOpen(!isOpen)

  // Handle keyboard events
  useEffect(() => {
    const handleResize = () => {
      const windowHeight = window.visualViewport?.height || window.innerHeight;
      const diff = window.innerHeight - windowHeight;
      setIsKeyboardOpen(diff > 150); // Threshold to detect keyboard
    };

    // Subscribe to visualViewport changes if available, otherwise use resize
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

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
              <div className="flex-1 h-full w-full md:w-[70%] touch-none">
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
                ref={sheetRef}
                className="md:hidden fixed inset-x-0 z-50 
                  bg-white shadow-lg rounded-t-xl transform
                  transition-transform duration-300 ease-out"
                style={{
                  height: '60vh',
                  bottom: isKeyboardOpen ? '0' : '0',
                  transform: `translateY(${isOpen ? '0' : '100%'})`,
                  position: isKeyboardOpen ? 'absolute' : 'fixed'
                }}
              >
                {/* Tab Handle - Hide when keyboard is open */}
                {!isKeyboardOpen && (
                  <div 
                    className="absolute -top-12 left-1/2 -translate-x-1/2 
                      bg-gradient-to-r from-pink-500 via-purple-500 to-purple-600
                      rounded-t-xl px-6 py-2 cursor-pointer shadow-lg
                      hover:scale-105 transition-all"
                    onClick={toggleSheet}
                  >
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-6 h-6 text-white" />
                      <ChevronUp 
                        className={`w-6 h-6 text-white transition-transform duration-300
                          ${!isOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                )}

                {/* Scrollable Content */}
                <div 
                  className="h-full overflow-y-auto overscroll-contain"
                  style={{
                    paddingBottom: isKeyboardOpen ? '16px' : 'env(safe-area-inset-bottom)'
                  }}
                >
                  <div className="px-4 py-2">
                    <AddPlace />
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