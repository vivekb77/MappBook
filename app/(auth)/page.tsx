"use client"

import { useState, useRef } from 'react'
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
  const [hasClicked, setHasClicked] = useState(false)
  const { isLoaded, isSignedIn, user } = useUser()
  
  // State for drag functionality
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [prevTranslate, setPrevTranslate] = useState(100)
  const [currentTranslate, setCurrentTranslate] = useState(100)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Constants for sheet positions
  const CLOSED_POSITION = 100
  const OPEN_POSITION = 0
  const SNAP_THRESHOLD = 50

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartY(e.clientY)
    setPrevTranslate(currentTranslate)
    const sheet = sheetRef.current
    if (sheet) {
      sheet.style.cursor = 'grabbing'
      sheet.style.userSelect = 'none'
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const currentY = e.clientY
    const diff = currentY - startY
    const sheetHeight = sheetRef.current?.offsetHeight || 0
    const newTranslate = Math.max(0, Math.min(100, (diff / sheetHeight) * 100 + prevTranslate))
    setCurrentTranslate(newTranslate)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    const sheet = sheetRef.current
    if (sheet) {
      sheet.style.cursor = 'grab'
      sheet.style.userSelect = 'auto'
    }
    // Snap to position
    setCurrentTranslate(currentTranslate > SNAP_THRESHOLD ? CLOSED_POSITION : OPEN_POSITION)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartY(e.touches[0].clientY)
    setPrevTranslate(currentTranslate)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const currentY = e.touches[0].clientY
    const diff = currentY - startY
    const sheetHeight = sheetRef.current?.offsetHeight || 0
    const newTranslate = Math.max(0, Math.min(100, (diff / sheetHeight) * 100 + prevTranslate))
    setCurrentTranslate(newTranslate)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    setCurrentTranslate(currentTranslate > SNAP_THRESHOLD ? CLOSED_POSITION : OPEN_POSITION)
  }

  const handleChevronClick = () => {
    if (!hasClicked) {
      track('Chevron button clicked')
      setHasClicked(true)
    }
    setCurrentTranslate(currentTranslate === CLOSED_POSITION ? OPEN_POSITION : CLOSED_POSITION)
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
                ref={sheetRef}
                className={`md:hidden fixed bottom-0 left-0 right-0 z-50 
                  bg-white h-[60%] shadow-lg rounded-t-xl
                  ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
                style={{
                  transform: `translateY(${currentTranslate}%)`,
                  paddingBottom: 'env(safe-area-inset-bottom)',
                  height: 'calc(var(--vh, 1vh) * 60)',
                  touchAction: 'none'
                }}
              >
                {/* Chevron with location icon */}
                <div className="absolute -top-12 right-16 touch-none w-[256px]">
                  <div
                    className="relative cursor-pointer"
                    onClick={handleChevronClick}
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
                    <button
                      className={`absolute top-0 left-[128px] -translate-y-1/2 
                        flex items-center justify-center pointer-events-none
                        ${!hasClicked ? 'animate-bounce' : ''} group w-12 h-12`}
                      aria-label="Toggle places panel"
                    >
                      <MapPin
                        className="w-8 h-8 text-pink-200 stroke-[3] transform transition-transform 
                          group-hover:scale-110 group-hover:rotate-12"
                      />
                    </button>
                  </div>
                </div>

                {/* Sheet Content */}
                <div className="h-full flex flex-col">
                  {/* Drag Handle */}
                  <div 
                    className="w-full h-12 flex items-center justify-center cursor-grab touch-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div className="w-16 h-1.5 bg-gray-300 rounded-full" />
                  </div>
                  <div className="flex-1 min-h-0">
                    <div className="h-full px-4 pb-4 overflow-y-auto overscroll-contain">
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