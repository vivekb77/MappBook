"use client"

import { useState, useRef, useEffect } from 'react'
import AddPlace from '@/components/Search/AddPlace'
import MapboxMap from '@/components/Map/MapBoxMap'
import { SearchedPlaceDetailsContext } from '@/context/SearchedPlaceDetailsContext'
import { AllUserPlacesContext } from '@/context/AllUserPlacesContext'
import { MapStatsProvider } from '@/context/MapStatsContext';
import { Search } from 'lucide-react'

export default function Home() {
  const [searchedPlace, setSearchedPlaceDetails] = useState<any>([]);
  const [userPlaces, setAllUserPlaces] = useState<any[]>([]);
  const [sheetState, setSheetState] = useState<'closed' | 'peek' | 'full'>('closed')
  const sheetRef = useRef<HTMLDivElement>(null)
  const [startY, setStartY] = useState<number | null>(null)
  const [currentY, setCurrentY] = useState<number>(0)

  // Touch handlers remain the same
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setStartY(clientY - currentY)
  }

  const handleDragMove = (e: TouchEvent | MouseEvent) => {
    if (startY === null || !sheetRef.current) return
    const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY
    const delta = clientY - startY
    const maxHeight = window.innerHeight * 0.9
    const minHeight = 100
    
    if (delta >= 0 && delta <= maxHeight) {
      setCurrentY(delta)
      if (delta > maxHeight * 0.6) {
        setSheetState('peek')
      } else {
        setSheetState('full')
      }
    }
  }

  const handleDragEnd = () => {
    setStartY(null)
    const maxHeight = window.innerHeight * 0.9
    if (currentY > maxHeight * 0.6) {
      setCurrentY(maxHeight * 0.8)
      setSheetState('peek')
    } else {
      setCurrentY(0)
      setSheetState('full')
    }
  }

  useEffect(() => {
    if (startY !== null) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
      window.addEventListener('touchmove', handleDragMove)
      window.addEventListener('touchend', handleDragEnd)
      
      return () => {
        window.removeEventListener('mousemove', handleDragMove)
        window.removeEventListener('mouseup', handleDragEnd)
        window.removeEventListener('touchmove', handleDragMove)
        window.removeEventListener('touchend', handleDragEnd)
      }
    }
  }, [startY])

  return (
    <div className="h-screen w-screen overflow-hidden">
      <SearchedPlaceDetailsContext.Provider value={{ searchedPlace, setSearchedPlaceDetails }}>
        <AllUserPlacesContext.Provider value={{ userPlaces, setAllUserPlaces }}>
        <MapStatsProvider>
          <div className="flex h-full w-full relative">
            {/* Map Section - Adjusted width for desktop */}
            <div className="flex-1 h-full w-full md:w-[70%]">
              <MapboxMap />
            </div>

            {/* Desktop Sidebar - Set to 30% width */}
            <div className="hidden md:block w-[30%] bg-white h-full">
              <div className="h-full p-4 overflow-y-auto">
                {/* <h3 className="text-xl font-semibold text-gray-800 mb-6">
                  Find Places
                </h3> */}
                <AddPlace />
              </div>
            </div>

            {/* Mobile Search Button - Unchanged */}
            {sheetState === 'closed' && (
              <button 
                onClick={() => setSheetState('peek')}
                className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 
                  bg-white shadow-lg rounded-full px-6 py-3 
                  flex items-center gap-2 z-20"
              >
                <Search className="w-5 h-5" />
                <span>Add Places</span>
              </button>
            )}

            {/* Mobile Bottom Sheet - Unchanged */}
            {sheetState !== 'closed' && (
              <div 
                ref={sheetRef}
                className="md:hidden fixed bottom-0 left-0 right-0 
                  bg-white rounded-t-3xl z-40
                  transition-transform duration-300 ease-in-out"
                style={{
                  transform: `translateY(${currentY}px)`,
                  maxHeight: '90vh',
                  touchAction: 'none'
                }}
              >
                {sheetState === 'full' && (
                  <div 
                    className="fixed inset-0 bg-black/50 -z-10"
                    onClick={() => setSheetState('peek')}
                  />
                )}

                <div 
                  className="flex justify-center p-4 cursor-grab active:cursor-grabbing"
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                >
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full"/>
                </div>
                
                <div className="p-4 overflow-y-auto" style={{ height: sheetState === 'peek' ? '300px' : 'auto' }}>
                  {/* <h3 className="text-xl font-semibold text-gray-800 mb-6">
                    Find Places
                  </h3> */}
                  <AddPlace />
                </div>

                {sheetState === 'peek' && (
                  <button
                    onClick={() => setSheetState('closed')}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>
          </MapStatsProvider>
        </AllUserPlacesContext.Provider>
      </SearchedPlaceDetailsContext.Provider>
    </div>
  )
}