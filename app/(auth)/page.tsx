"use client"

import { useState, useRef } from 'react'
import AddPlace from '@/components/Search/AddPlace'
import MapboxMap from '@/components/Map/MapBoxMap'
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext'
import { AllUserPlacesContext } from '@/context/AllUserPlacesContext'
import { MapStatsProvider } from '@/context/MapStatsContext'
import { MapPin, ChevronUp, ChevronDown, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [searchedPlace, setSearchedPlaceDetails] = useState<any>([])
  const [userPlaces, setAllUserPlaces] = useState<any[]>([])
  const [hasClicked, setHasClicked] = useState(false)
  const { isLoaded, isSignedIn, user } = useUser()
  
  // State for drag functionality
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentTranslate, setCurrentTranslate] = useState(100)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Constants for sheet limits
  const MIN_TRANSLATE = 10
  const MAX_TRANSLATE = 100
  const MID_POINT = (MIN_TRANSLATE + MAX_TRANSLATE) / 2

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!hasClicked) setHasClicked(true)
    setIsDragging(true)
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setStartY(clientY)
  }

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const diff = clientY - startY
    const sheetHeight = sheetRef.current?.offsetHeight || 0
    
    const newTranslate = Math.max(
      MIN_TRANSLATE,
      Math.min(MAX_TRANSLATE, currentTranslate + (diff / sheetHeight) * 100)
    )
    
    setCurrentTranslate(newTranslate)
    setStartY(clientY)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  if (!isLoaded) return (
    <div className="viewport-height w-full flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  )

  // Determine if sheet is more closed or open
  const isMoreClosed = currentTranslate > MID_POINT

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
                className={`md:hidden fixed bottom-0 left-0 right-0 z-50 
                  bg-white shadow-lg rounded-t-xl
                  ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
                style={{
                  transform: `translateY(${currentTranslate}%)`,
                  paddingBottom: 'env(safe-area-inset-bottom)',
                  height: '80vh',
                  touchAction: 'none'
                }}
              >
                {/* Chevron with Direction Indicator */}
                <div
                  className="absolute -top-12 right-16 w-[256px] cursor-grab active:cursor-grabbing touch-none"
                  onTouchStart={handleDragStart}
                  onTouchMove={handleDragMove}
                  onTouchEnd={handleDragEnd}
                  onMouseDown={handleDragStart}
                  onMouseMove={handleDragMove}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                >
                  <svg width="100%" height="48" className="block shadow-xl">
                    <defs>
                      <linearGradient id="chevronGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#EC4899' }} />
                        <stop offset="50%" style={{ stopColor: '#D946EF' }} />
                        <stop offset="100%" style={{ stopColor: '#A855F7' }} />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,48 H256 C192,48 160,0 128,0 C96,0 64,48 0,48"
                      fill="url(#chevronGradient)"
                    />
                  </svg>
                  <div className={`absolute top-0 left-[128px] -translate-y-1/2 
                    flex flex-col items-center justify-center pointer-events-none
                    ${!hasClicked ? 'animate-bounce' : ''} group`}
                  >
                    <MapPin className="w-8 h-8 text-pink-200 stroke-[3] mb-1" />
                  </div>
                </div>

                {/* Sheet Content */}
                <div className="h-full flex flex-col">
                  <div className="flex-1 min-h-0">
                    <div className="h-full px-4 pt-4 pb-4 overflow-y-auto overscroll-contain">
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