"use client"

import { useRef, useState } from 'react'
import { ChevronUp } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import browser-dependent components
const VideoPreview = dynamic(
  () => import('@/components/Passport/VideoPreview').then(mod => mod.VideoPreview),
  { ssr: false }
)

const PassportDashboard = dynamic(
  () => import('@/components/Passport/PassportDashboard').then(mod => mod.PassportDashboard),
  { ssr: false }
)

interface VideoPreviewState {
  url: string | null
  loading: boolean
  error: string | null
}

export default function RecordVideoPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [videoState, setVideoState] = useState<VideoPreviewState>({
    url: null,
    loading: false,
    error: null
  })
  const sheetRef = useRef<HTMLDivElement>(null)
  
  const toggleSheet = () => setIsOpen(!isOpen)

  const handleVideoUrlChange = (url: string | null) => {
    setVideoState(prev => ({
      ...prev,
      url,
      loading: false,
      error: null
    }))
  }

  const handleRecordingStart = () => {
    setVideoState(prev => ({
      ...prev,
      loading: true,
      error: null
    }))
  }

  const handleRecordingError = (error: string) => {
    setVideoState(prev => ({
      ...prev,
      loading: false,
      error
    }))
  }

  return (
    <div className="fixed inset-0 h-screen-dynamic overflow-hidden">
      <div className="flex h-full w-full relative">
        {/* Video Preview Section */}
        <div className="w-full md:w-[70%] h-full bg-slate-900">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
              <h2 className="text-xl font-semibold text-white">Video Preview</h2>
            </div>
            
            {/* Preview Container */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="rounded-lg overflow-hidden shadow-2xl bg-slate-800 max-w-full">
                {videoState.loading ? (
                  <div className="flex items-center justify-center h-[400px] w-[600px] bg-slate-800">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : videoState.error ? (
                  <div className="flex items-center justify-center h-[400px] w-[600px] bg-slate-800 text-red-400 p-4 text-center">
                    {videoState.error}
                  </div>
                ) : (
                  <VideoPreview videoUrl={videoState.url} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block w-[30%] bg-white border-l border-slate-200 h-full">
          <div className="h-full p-4 overflow-y-auto">
            <PassportDashboard 
              onVideoUrlChange={handleVideoUrlChange}
              onRecordingStart={handleRecordingStart}
              onRecordingError={handleRecordingError}
            />
          </div>
        </div>

        {/* Mobile Bottom Sheet */}
        <div
          ref={sheetRef}
          className="md:hidden fixed inset-x-0 z-50 bg-white shadow-lg rounded-t-xl transform transition-transform duration-300 ease-out"
          style={{
            height: '60vh',
            bottom: 0,
            transform: `translateY(${isOpen ? '0' : '100%'})`
          }}
        >
          {/* Tab Handle */}
          <div 
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-[50%] max-w-md bg-gradient-to-r from-pink-500 via-purple-500 to-purple-600 rounded-t-xl px-6 py-4 cursor-pointer shadow-lg hover:scale-105 transition-all"
            onClick={toggleSheet}
          >
            <div className="flex items-center justify-center space-x-2">
              <ChevronUp 
                className={`w-8 h-8 text-white transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="h-full overflow-y-auto overscroll-contain">
            <div className="px-4 py-2">
              <PassportDashboard 
                onVideoUrlChange={handleVideoUrlChange}
                onRecordingStart={handleRecordingStart}
                onRecordingError={handleRecordingError}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}