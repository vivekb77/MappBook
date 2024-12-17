"use client"

import { Video, Play, Pause } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

interface VideoPreviewProps {
  videoUrl: string | null
}

export function VideoPreview({ videoUrl }: VideoPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 })

  // Update time and duration
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime || 0)
    }
  }

  const handleLoadedMetadata = () => {

    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0)
      setCurrentTime(0)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [])

  useEffect(() => {
    if (videoUrl) {
      setIsLoading(true)
      const video = document.createElement('video')
      video.src = videoUrl

      video.onloadedmetadata = () => {
        setIsLoading(false)
        if (videoRef.current) {
          setDuration(videoRef.current.duration)
        }
      }

      video.onerror = () => {
        console.error('Error loading video:', video.error)
        setIsLoading(false)
      }
    }
  }, [videoUrl])
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [])

  const handleMouseMove = () => {
    setShowControls(true)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 2000)
  }

  const handleMouseLeave = () => {
    setShowControls(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleTouchStart = () => {
    setShowControls(true)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 2000)
  }

  const togglePlay = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (videoRef.current) {
      try {
        if (videoRef.current.paused) {
          await videoRef.current.play()
          setIsPlaying(true)
        } else {
          videoRef.current.pause()
          setIsPlaying(false)
        }
      } catch (error) {
        console.error('Error toggling play/pause:', error)
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (videoRef.current && duration) {
      const bounds = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - bounds.left
      const percent = x / bounds.width
      videoRef.current.currentTime = percent * duration
    }
  }

  if (!videoUrl) {
    return (
      <div className="flex justify-center">
        <div
          className="bg-slate-800/50 rounded-lg flex items-center justify-center"
          style={{
            width: videoDimensions.width || '640px',  // Default width if no video
            height: videoDimensions.height || '360px', // Default 16:9 aspect ratio
            minWidth: '320px',                        // Minimum width
            minHeight: '180px'                        // Minimum height
          }}
        >
          <div className="flex flex-col items-center justify-center">
            <Video className="w-12 h-12 md:w-16 md:h-16 opacity-50" />
            <p className="text-base md:text-lg font-medium mt-4 text-gray-400">No video selected</p>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="flex justify-center">
      <div
        className="bg-slate-950 rounded-lg overflow-hidden relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        style={{
          width: videoDimensions.width || '100%',
          height: videoDimensions.height || '100%'
        }}
      >
        {isLoading ? (
          <div className="relative w-full h-full">
            {/* Keep video element to maintain dimensions but hide it */}
            <video
              ref={videoRef}
              className="w-full h-full object-contain opacity-0"
              src={videoUrl}
              playsInline
              preload="auto"
              controls={false}
            />

            {/* Loading overlay */}
            <div
              className="absolute inset-0 bg-slate-800/50 backdrop-blur-sm flex items-center justify-center"
              style={{
                width: videoDimensions.width || '100%',
                height: videoDimensions.height || '100%',
                minWidth: '320px',
                minHeight: '180px'
              }}
            >
              <div className="flex flex-col items-center justify-center p-4">
                <Video className="w-12 h-12 md:w-16 md:h-16 opacity-50 animate-pulse" />
                <p className="text-base md:text-lg font-medium mt-4 text-gray-400 text-center">
                  Loading video
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full" onClick={togglePlay}>
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              src={videoUrl}
              playsInline
              controls={false}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />

            {/* Controls overlay */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-4 py-3 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-1 hover:opacity-80 transition-opacity bg-transparent"
                >
                  {isPlaying ?
                    <Pause className="w-6 h-6 text-white" /> :
                    <Play className="w-6 h-6 text-white" />
                  }
                </button>

                <div className="text-white text-sm font-medium">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div
                className="w-full h-1 bg-white/30 cursor-pointer rounded-full mt-2"
                onClick={handleProgressClick}
              >
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}