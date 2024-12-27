"use client"

import { useState, useRef } from 'react'
import { ChevronUp, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import dynamic from 'next/dynamic'

const Dashboard = dynamic(() => import('@/components/MapAnimation/Dashboard'))
const MapboxMap = dynamic(() => import('@/components/MapAnimation/MapBoxMap'))

export default function Create() {
  const { isLoaded } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const sheetRef = useRef(null)
  const toggleSheet = () => setIsOpen(!isOpen)

  if (!isLoaded) {
    return (
      <div className="h-screen-dynamic w-full flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center gap-5">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-blue-900" />
            <div 
              className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-t-[3px] border-blue-500"
              style={{ animationDirection: 'reverse' }} 
            />
          </div>
          <span className="text-lg font-medium text-gray-300">
            Loading MappBook
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 h-screen-dynamic overflow-hidden bg-gray-900">
      <div className="flex h-full w-full relative">
        {/* Map Section */}
        <div className="flex-1 h-full w-full md:w-[67%] touch-none">
          <MapboxMap />
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block w-[33%] h-screen-dynamic overflow-hidden bg-gray-800 border-l border-gray-700">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <Dashboard />
          </div>
        </div>

        {/* Mobile Bottom Sheet */}
        <div
          ref={sheetRef}
          className="md:hidden fixed inset-x-0 z-50 
            bg-gray-800 shadow-xl rounded-t-xl transform
            transition-transform duration-300 ease-out
            border-t border-gray-700"
          style={{
            height: '60vh',
            bottom: 0,
            transform: `translateY(${isOpen ? '0' : '100%'})`
          }}
        >
          {/* Tab Handle */}
          <div
            className="absolute -top-12 left-1/2 -translate-x-1/2 w-[50%] max-w-md
              bg-gradient-to-r from-blue-600 to-blue-500
              rounded-t-xl px-6 py-4 cursor-pointer shadow-lg
              hover:scale-105 transition-all
              border-t border-l border-r border-blue-400"
            onClick={toggleSheet}
          >
            <div className="flex items-center justify-center space-x-2">
              <ChevronUp
                className={`w-8 h-8 text-white transition-transform duration-300
                  ${!isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="h-full overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">

              <Dashboard />

          </div>
        </div>
      </div>
    </div>
  )
}