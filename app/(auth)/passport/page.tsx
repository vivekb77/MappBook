"use client"
import { useRef, useState } from 'react'
import { ChevronUp } from 'lucide-react'
import dynamic from 'next/dynamic'


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
  const [videoState, setVideoState] = useState<VideoPreviewState>({
    url: null,
    loading: false,
    error: null
  })

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
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Layout (Large Screens) */}
      <div className="hidden lg:flex w-full h-screen">
        {/* Video Preview - Left Side (70%) */}
        <div className="w-[60%] bg-slate-900 p-4">
          <div className="h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center">
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

        {/* Passport Dashboard - Right Side (30%) */}
        <div className="w-[40%] bg-white border-l border-slate-200 p-4 overflow-y-auto">
          <PassportDashboard
            onVideoUrlChange={handleVideoUrlChange}
            onRecordingStart={handleRecordingStart}
            onRecordingError={handleRecordingError}
          />
        </div>
      </div>

      {/* Mobile & Tablet Layout (Small and Medium Screens) */}
      <div className="lg:hidden relative min-h-screen">
        {/* Fixed Video Preview at Top */}
        <div className="sticky top-0 z-10 bg-slate-900 p-4 border-b border-slate-700">
          <div className="rounded-lg overflow-hidden shadow-2xl bg-slate-800">
            {videoState.loading ? (
              <div className="flex items-center justify-center h-[200px] md:h-[300px] w-full bg-slate-800">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : videoState.error ? (
              <div className="flex items-center justify-center h-[200px] md:h-[300px] w-full bg-slate-800 text-red-400 p-4 text-center">
                {videoState.error}
              </div>
            ) : (
              <VideoPreview videoUrl={videoState.url}/>
            )}
          </div>
        </div>

        {/* Scrollable Dashboard Content */}
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