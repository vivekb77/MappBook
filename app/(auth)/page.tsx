"use client"

import { useState, useRef, useEffect } from 'react'
import { ChevronUp, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { Alert, AlertDescription } from "@/components/ui/alert"

// Components
import AddPlace from '@/components/Search/AddPlace'
import MapboxMap from '@/components/Map/MapBoxMap'

// Contexts
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext'
import { AllUserPlacesContext } from '@/context/AllUserPlacesContext'
import { MapStatsProvider } from '@/context/MapStatsContext'

export default function Home() {
  // States
  const [searchedPlace, setSearchedPlaceDetails] = useState<any>([])
  const [userPlaces, setAllUserPlaces] = useState<any[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  const [sheetHeight, setSheetHeight] = useState(0)
  
  // Auth states
  const { isLoaded, isSignedIn, user } = useUser()
  const [authError, setAuthError] = useState<string | null>(null)
  
  // Refs
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<number>(0)
  const dragCurrentRef = useRef<number>(0)

  // Calculate and update sheet height on mount and window resize
  useEffect(() => {
    const updateSheetHeight = () => {
      const vh = window.innerHeight
      setSheetHeight(vh * 0.5)
    }

    updateSheetHeight()
    window.addEventListener('resize', updateSheetHeight)
    return () => window.removeEventListener('resize', updateSheetHeight)
  }, [])

  // Update sheet position when open state changes
  useEffect(() => {
    if (sheetRef.current) {
      if (!isSheetOpen) {
        sheetRef.current.style.transform = 'translateY(100%)'
      } else {
        sheetRef.current.style.transform = 'translateY(0)'
      }
    }
  }, [isSheetOpen])

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    dragStartRef.current = touch.clientY
    dragCurrentRef.current = touch.clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    const sheet = sheetRef.current
    if (!sheet) return

    dragCurrentRef.current = touch.clientY
    const delta = dragCurrentRef.current - dragStartRef.current

    // Calculate drag progress percentage
    const progress = Math.max(0, Math.min(100, (delta / window.innerHeight) * 100))
    setDragProgress(progress)

    if (isSheetOpen) {
      // When sheet is open, only allow dragging down
      if (delta > 0) {
        sheet.style.transform = `translateY(${delta}px)`
      }
    } else {
      // When sheet is closed, only allow dragging up
      const upDelta = Math.min(0, delta)
      const progress = Math.abs(upDelta) / 200 // 200px threshold for opening
      sheet.style.transform = `translateY(${100 - progress * 100}%)`
    }
  }

  const handleTouchEnd = () => {
    const delta = dragCurrentRef.current - dragStartRef.current
    
    if (isSheetOpen) {
      // If dragged down more than 150px while open, close it
      if (delta > 150) {
        setIsSheetOpen(false)
      } else {
        // Snap back to open position
        if (sheetRef.current) {
          sheetRef.current.style.transform = 'translateY(0)'
        }
      }
    } else {
      // If dragged up more than 50px while closed, open it
      if (delta < -50) {
        setIsSheetOpen(true)
      } else {
        // Snap back to closed position
        if (sheetRef.current) {
          sheetRef.current.style.transform = 'translateY(100%)'
        }
      }
    }
    
    setDragProgress(0)
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  // Not signed in state
  if (!isSignedIn) {
    return (
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
  }

  // Authentication error state
  if (authError) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full px-4">
          <Alert variant="destructive">
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <SearchedPlaceDetailsContext.Provider value={{ searchedPlace, setSearchedPlaceDetails }}>
        <AllUserPlacesContext.Provider value={{ userPlaces, setAllUserPlaces }}>
          <MapStatsProvider>
            <div className="flex h-full w-full relative">
              {/* Map Section */}
              <div className="absolute inset-0 md:w-[70%]">
                <MapboxMap />
              </div>

              {/* Desktop Sidebar */}
              <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[30%] bg-white">
                <div className="h-full p-4 overflow-y-auto">
                  <AddPlace />
                </div>
              </div>

              {/* Fancy Pull Tab */}
              <div 
                className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 
                  z-20 touch-none cursor-pointer w-40"
                onClick={() => setIsSheetOpen(!isSheetOpen)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="relative flex flex-col items-center">
                  <div className="w-full bg-white/95 rounded-t-2xl shadow-lg 
                    border border-pink-100/50 backdrop-blur-sm
                    overflow-hidden">
                    {/* Gradient Bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-pink-400 to-purple-400"/>
                    
                    {/* Content Container */}
                    <div className="px-4 py-2 flex flex-col items-center">
                      {/* Icon Circle */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 
                        flex items-center justify-center shadow-inner mb-1">
                        <ChevronUp 
                          className={`w-5 h-5 text-white transition-transform duration-700
                            ${isSheetOpen ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sheet Container */}
              <div className={`md:hidden ${isSheetOpen ? 'visible' : 'invisible'}`}>
                {/* Mobile Bottom Sheet */}
                <div 
                  ref={sheetRef}
                  className="fixed left-0 right-0 bottom-0 z-40 bg-white/95 backdrop-blur-sm
                    rounded-t-[30px] shadow-lg transition-all duration-700 ease-in-out"
                  style={{
                    height: `${sheetHeight}px`,
                    transform: 'translateY(100%)',
                  }}
                >
                  {/* Gradient Top Bar */}
                  <div className="h-1 w-full bg-gradient-to-r from-pink-400 to-purple-400 
                    rounded-t-[30px]"/>
                  
                  {/* Drag Handle Container */}
                  <div 
                    className="flex justify-center p-4 touch-none bg-white/95 backdrop-blur-sm
                      border-b border-pink-100/50"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 
                      flex items-center justify-center shadow-inner">
                      <ChevronUp 
                        className={`w-5 h-5 text-white transition-transform duration-700
                          ${isSheetOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div 
                    className="overflow-y-auto bg-white"
                    style={{
                      height: `calc(${sheetHeight}px - 53px)`
                    }}
                  >
                    <div className="p-4">
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