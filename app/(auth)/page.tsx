"use client"

import { useState, useRef, useEffect } from 'react'
import AddPlace from '@/components/Search/AddPlace'
import MapboxMap from '@/components/Map/MapBoxMap'
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext'
import { AllUserPlacesContext } from '@/context/AllUserPlacesContext'
import { MapStatsProvider } from '@/context/MapStatsContext'
import { MapPin, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Home() {
  const [searchedPlace, setSearchedPlaceDetails] = useState<any>([])
  const [userPlaces, setAllUserPlaces] = useState<any[]>([])
  const [sheetPosition, setSheetPosition] = useState<number>(95)
  const { isLoaded, isSignedIn, user } = useUser()
  const [authError, setAuthError] = useState<string | null>(null)
  
  const sheetRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [startY, setStartY] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    const preventDefault = (e: Event) => {
      if (isDragging) {
        e.preventDefault()
      }
    }

    content.addEventListener('touchmove', preventDefault, { passive: false })
    return () => {
      content.removeEventListener('touchmove', preventDefault)
    }
  }, [isDragging])

  const handleChevronClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent the click from triggering drag events
    e.stopPropagation()
    
    // If sheet is closer to closed position, open it
    if (sheetPosition > 70) {
      setSheetPosition(20) // Open to 60% from bottom (40% from top)
    } else {
      setSheetPosition(95) // Close
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't start drag if it's a click on the chevron
    if ((e.target as HTMLElement).closest('.chevron-click-target')) {
      return
    }
    
    const touch = e.touches[0]
    setStartY(touch.clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === null || !isDragging) return
    
    const touch = e.touches[0]
    const deltaY = touch.clientY - startY
    const windowHeight = window.innerHeight
    
    let newPosition = sheetPosition + (deltaY / windowHeight) * 100
    // Limit dragging between 40% (60% from bottom) and 95%
    newPosition = Math.max(40, Math.min(95, newPosition))
    
    setSheetPosition(newPosition)
    setStartY(touch.clientY)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    setStartY(null)
    setIsDragging(false)
    
    if (sheetPosition > 90) {
      setSheetPosition(95) // Close
    } else if (sheetPosition < 75) {
      setSheetPosition(40) // Open to 60% from bottom
    } else {
      setSheetPosition(95) // Close
    }
  }

  // Loading state
  if (!isLoaded) return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  )

  // Not signed in state
  if (!isSignedIn) return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-4">
        <Alert variant="destructive">
          <AlertDescription>
            Please sign in to access MappBook
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )

  // Authentication error state
  if (authError) return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-4">
        <Alert variant="destructive">
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      </div>
    </div>
  )

  return (
    <div className="h-screen w-screen overflow-hidden">
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

              {/* Bottom Sheet with Right-Aligned Chevron */}
              <div
                ref={sheetRef}
                style={{
                  transform: `translateY(${sheetPosition}%)`,
                }}
                className={`md:hidden fixed bottom-0 left-0 right-0 z-40
                  ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
              >
                {/* Right-aligned chevron top with location icon */}
                <div 
                  className="absolute -top-8 right-8 w-48 h-8"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <svg width="100%" height="32" className="block shadow-lg">
                    <path 
                      d="M0,32 H192 C144,32 120,0 96,0 C72,0 48,32 0,32" 
                      fill="white" 
                      width="100%"
                    />
                  </svg>
                  <div 
                    className="absolute inset-0 flex items-center justify-center -mt-1 
                      chevron-click-target cursor-pointer"
                    onClick={handleChevronClick}
                    onTouchEnd={(e) => {
                      e.preventDefault()
                      if (!isDragging) handleChevronClick(e)
                    }}
                  >
                    <MapPin className="w-6 h-6 text-gray-700 stroke-[2.5]" />
                  </div>
                </div>

                {/* Main Content */}
                <div className="bg-white shadow-lg">
                  <div 
                    ref={contentRef}
                    className="px-4 pt-2 pb-4 overflow-y-auto overscroll-none"
                    style={{
                      height: `${100 - Math.max(0, sheetPosition)}vh`
                    }}
                  >
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