"use client"

import { useState, useRef, useEffect } from 'react'
import AddPlace from '@/components/Search/AddPlace'
import MapboxMap from '@/components/Map/MapBoxMap'
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext'
import { AllUserPlacesContext } from '@/context/AllUserPlacesContext'
import { MapStatsProvider } from '@/context/MapStatsContext'
import { MapPin, ChevronUp, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [searchedPlace, setSearchedPlaceDetails] = useState<any>([])
  const [userPlaces, setAllUserPlaces] = useState<any[]>([])
  const [hasClicked, setHasClicked] = useState(false)
  const { isLoaded, isSignedIn, user } = useUser()
  
  // Enhanced dragging state
  const [isDragging, setIsDragging] = useState(false)
  const [currentTranslate, setCurrentTranslate] = useState(100) // Start fully closed
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef(0)
  const currentTranslateRef = useRef(0)
  const velocityRef = useRef(0)
  const lastTouchRef = useRef(0)

  // Snap points in percentage from bottom of screen
  const SNAP_POINTS = {
    CLOSED: 100,   // Completely closed
    PEEK: 85,      // Just showing the handle
    HALF: 50,      // Half-way point
    OPEN: 0        // Fully open
  }

  const calculateVelocity = (currentY: number, timestamp: number) => {
    const timeDiff = timestamp - lastTouchRef.current
    if (timeDiff > 0) {
      const distance = currentY - dragStartRef.current
      velocityRef.current = distance / timeDiff
    }
    lastTouchRef.current = timestamp
  }

  const findNearestSnapPoint = (currentPosition: number, velocity: number) => {
    const snapPoints = Object.values(SNAP_POINTS)
    const threshold = 0.5 // Velocity threshold for momentum

    // If velocity is high enough, snap in direction of momentum
    if (Math.abs(velocity) > threshold) {
      return velocity > 0 
        ? Math.min(...snapPoints.filter(point => point > currentPosition))
        : Math.max(...snapPoints.filter(point => point < currentPosition))
    }

    // Otherwise snap to nearest point
    return snapPoints.reduce((nearest, point) => 
      Math.abs(point - currentPosition) < Math.abs(nearest - currentPosition) ? point : nearest
    )
  }

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!hasClicked) setHasClicked(true)
    setIsDragging(true)
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragStartRef.current = clientY
    currentTranslateRef.current = currentTranslate
    lastTouchRef.current = e.timeStamp
    velocityRef.current = 0
    
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none'
    }
  }

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const diff = clientY - dragStartRef.current
    const sheetHeight = sheetRef.current?.offsetHeight || 0
    
    calculateVelocity(clientY, e.timeStamp)
    
    const newTranslate = Math.max(
      SNAP_POINTS.OPEN,
      Math.min(SNAP_POINTS.CLOSED, 
        currentTranslateRef.current + (diff / sheetHeight) * 100
      )
    )
    
    setCurrentTranslate(newTranslate)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
    }
    
    const nearestSnapPoint = findNearestSnapPoint(currentTranslate, velocityRef.current)
    setCurrentTranslate(nearestSnapPoint)
  }

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if ((e.target as Element).closest('.bottom-sheet-content')) return
      handleDragStart(e as unknown as React.TouchEvent)
    }

    const handleTouchMove = (e: TouchEvent) => {
      handleDragMove(e as unknown as React.TouchEvent)
    }

    const handleTouchEnd = () => {
      handleDragEnd()
    }

    const sheet = sheetRef.current
    if (sheet) {
      sheet.addEventListener('touchstart', handleTouchStart)
      sheet.addEventListener('touchmove', handleTouchMove)
      sheet.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      if (sheet) {
        sheet.removeEventListener('touchstart', handleTouchStart)
        sheet.removeEventListener('touchmove', handleTouchMove)
        sheet.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging])

  if (!isLoaded) return (
    <div className="viewport-height w-full flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  )

  const isFullyClosed = currentTranslate >= SNAP_POINTS.CLOSED - 1

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
                  bg-white shadow-lg rounded-t-xl transform will-change-transform
                  ${isDragging ? 'transition-none' : 'transition-transform duration-300 ease-out'}`}
                style={{
                  transform: `translateY(${currentTranslate}%)`,
                  paddingBottom: 'env(safe-area-inset-bottom)',
                  height: 'min(80vh, 600px)',
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
                    ${!hasClicked ? 'animate-bounce' : ''}`}
                  >
                    <MapPin 
                      className={`w-8 h-8 text-pink-200 stroke-[3] mb-1
                        transform transition-transform duration-200
                        ${isDragging ? 'scale-110' : ''}`} 
                    />
                    {isFullyClosed && (
                      <ChevronUp 
                      className="w-6 h-6 text-pink-200 animate-pulse stroke-[4]"
                      style={{ 
                        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))',
                      }}
                      />
                    )}
                  </div>
                </div>

                {/* Sheet Content */}
               <div className="h-full flex flex-col bottom-sheet-content relative">
                  {/* Add visual drag handle at top */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full" />
                  
                  <div className="flex-1 min-h-0 mt-6">
                    <div 
                      className="h-full px-4 overflow-y-auto overscroll-contain"
                      style={{
                        maxHeight: `calc(100% - env(safe-area-inset-bottom))`,
                        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)'
                      }}
                    >
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