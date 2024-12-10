// components/VideoPreview.tsx
"use client"

import { Video } from 'lucide-react'

interface VideoPreviewProps {
  videoUrl: string | null
}

export function VideoPreview({ videoUrl }: VideoPreviewProps) {
  return (
    <div className="flex-1 h-full w-full md:w-[67%] bg-gray-900 flex items-center justify-center">
      {videoUrl ? (
        <video 
          src={videoUrl} 
          controls 
          className="max-w-full max-h-full" 
          autoPlay 
          loop
          muted
        />
      ) : (
        <div className="text-center text-gray-400">
          <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Loading preview...</p>
        </div>
      )}
    </div>
  )
}