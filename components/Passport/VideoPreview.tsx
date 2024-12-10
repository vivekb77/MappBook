"use client"

import { Video } from 'lucide-react'
import Plyr from "plyr-react"
import { useEffect, useState } from 'react'

interface VideoPreviewProps {
  videoUrl: string | null
}

export function VideoPreview({ videoUrl }: VideoPreviewProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  
  useEffect(() => {
    if (videoUrl) {
      const video = document.createElement('video')
      video.src = videoUrl
      
      video.onloadedmetadata = () => {
        setDimensions({
          width: video.videoWidth,
          height: video.videoHeight
        })
      }
    }
  }, [videoUrl])

  const plyrOptions = {
    controls: [
      'play-large',
      'play',
      'progress',
      'current-time',
      'mute',
      'volume',
      'fullscreen'
    ],
    tooltips: { controls: true, seek: true },
    invertTime: false
  }

  return (
    <div className="relative flex items-center justify-center">
      {videoUrl ? (
        <div 
          style={{ 
            width: dimensions.width ? `${dimensions.width}px` : 'auto',
            height: dimensions.height ? `${dimensions.height}px` : 'auto'
          }}
          className="relative bg-slate-950 rounded-lg overflow-hidden"
        >
          <Plyr
            source={{
              type: 'video',
              sources: [{
                src: videoUrl,
                type: 'video/mp4',
              }]
            }}
            options={plyrOptions}
          />
        </div>
      ) : (
        <div className="p-12 text-center text-gray-400 bg-slate-800/50 rounded-lg">
          <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Loading preview...</p>
        </div>
      )}
    </div>
  )
}