"use client"
import { useRef, useState } from 'react'
import { ChevronUp } from 'lucide-react'
import dynamic from 'next/dynamic'

// Add Location interface
interface Location {
  place_names: string[];
  place_country: string;
  place_country_code: string;
}

interface VideoPreviewState {
  url: string | null;
  loading: boolean;
  error: string | null;
  processingLocations?: Location[];
  isProcessing: boolean;
  currentLocation?: string;
}

const VideoPreview = dynamic(
  () => import('@/components/Passport/VideoPreview').then(mod => mod.VideoPreview),
  { ssr: false }
)

const PassportDashboard = dynamic(
  () => import('@/components/Passport/PassportDashboard').then(mod => mod.PassportDashboard),
  { ssr: false }
)

// Update component props interfaces
interface VideoPreviewProps {
  videoUrl: string | null;
  isProcessing?: boolean;
  currentLocation?: string;
  remainingCount?: number;
  onLocationProcessed?: (location: string) => void;
}

interface PassportDashboardProps {
  onVideoUrlChange: (url: string | null) => void;
  onRecordingStart: (locations: Location[]) => void;
  onRecordingError: (error: string) => void;
}

export default function RecordVideoPage() {
  const [videoState, setVideoState] = useState<VideoPreviewState>({
    url: null,
    loading: false,
    error: null,
    processingLocations: [],
    isProcessing: false,
    currentLocation: undefined
  })

  const handleVideoUrlChange = (url: string | null) => {
    setVideoState(prev => ({
      ...prev,
      url,
      loading: false,
      error: null,
      isProcessing: false,
      processingLocations: [],
      currentLocation: undefined
    }))
  }

  const handleRecordingStart = (locations: Location[]) => {
    setVideoState(prev => ({
      ...prev,
      loading: true,
      error: null,
      isProcessing: true,
      processingLocations: locations,
      currentLocation: locations[0]?.place_country
    }))
  }

  const handleRecordingError = (error: string) => {
    setVideoState(prev => ({
      ...prev,
      loading: false,
      error,
      isProcessing: false,
      processingLocations: [],
      currentLocation: undefined
    }))
  }

  const handleLocationProcessed = (processedLocation: string) => {
    setVideoState(prev => {
      const remaining = prev.processingLocations?.filter(
        loc => loc.place_country !== processedLocation
      ) || []
      
      return {
        ...prev,
        processingLocations: remaining,
        currentLocation: remaining[0]?.place_country
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Layout (Large Screens) */}
      <div className="hidden lg:flex w-full h-screen">
        <div className="w-[60%] bg-slate-900 p-4">
          <div className="h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              <div className="rounded-lg overflow-hidden shadow-2xl bg-slate-800 max-w-full">
                <VideoPreview 
                  videoUrl={videoState.url}
                  isProcessing={videoState.isProcessing}
                  currentLocation={videoState.currentLocation}
                  remainingCount={videoState.processingLocations?.length || 0}
                  onLocationProcessed={handleLocationProcessed}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-[40%] bg-white border-l border-slate-200 p-4 overflow-y-auto">
          <PassportDashboard
            onVideoUrlChange={handleVideoUrlChange}
            onRecordingStart={handleRecordingStart}
            onRecordingError={handleRecordingError}
          />
        </div>
      </div>

      {/* Mobile & Tablet Layout */}
      <div className="lg:hidden relative min-h-screen">
        <div className="sticky top-0 z-10 bg-slate-900 p-4 border-b border-slate-700">
          <div className="rounded-lg overflow-hidden shadow-2xl bg-slate-800">
            <VideoPreview 
              videoUrl={videoState.url}
              isProcessing={videoState.isProcessing}
              currentLocation={videoState.currentLocation}
              remainingCount={videoState.processingLocations?.length || 0}
              onLocationProcessed={handleLocationProcessed}
            />
          </div>
        </div>

        <div className="bg-white min-h-screen pb-16 md:px-8">
          <PassportDashboard
            onVideoUrlChange={handleVideoUrlChange}
            onRecordingStart={handleRecordingStart}
            onRecordingError={handleRecordingError}
          />
        </div>
      </div>
    </div>
  )
}