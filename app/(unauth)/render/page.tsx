"use client"

import { useState, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import dynamic from 'next/dynamic'

const MapboxMap = dynamic(() => import('@/components/Render/RenderMapBoxMap'))

export default function Create() {
  const [isOpen, setIsOpen] = useState(false)




  return (
    <div className="fixed inset-0 h-screen-dynamic overflow-hidden bg-gray-900">
      <div className="flex h-full w-full relative">
        {/* Map Section */}
        <div className="flex-1 h-full w-full md:w-[70%] touch-none">
          <MapboxMap />
        </div>
      </div>
    </div>
  )
}