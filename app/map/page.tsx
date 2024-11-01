"use client"

import MapboxMap from '@/components/PublicMap/MapBoxMapPublic'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function Home() {
  const router = useRouter()

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Map Container */}
      <div className="h-full w-full">
        <MapboxMap />
      </div>

      {/* Create Map Button */}
      <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 flex justify-center px-4">
        <Button 
          onClick={() => router.push('/')}
          className="bg-white hover:bg-gray-50 text-black shadow-lg rounded-full px-6 py-3"
          size="lg"
        >
          Create Your Map
        </Button>
      </div>
    </main>
  )
}