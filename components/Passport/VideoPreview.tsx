"use client"

import { Video, Play, Pause, Repeat, Maximize, Minimize } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

interface VideoPreviewProps {
  videoUrl: string | null
}

export function VideoPreview({ videoUrl }: VideoPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 })
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-play when videoUrl changes
  useEffect(() => {
    if (videoUrl && videoRef.current) {
      setIsLoading(true)
      setHasEnded(false)
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch(error => console.error('Auto-play failed:', error))
    }
  }, [videoUrl])

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error)
    }
  }

  // Update time and duration
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime || 0
      setCurrentTime(Number.isFinite(time) ? time : 0)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0)
      setCurrentTime(0)
      setIsLoading(false)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setHasEnded(true)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
    }
  }

  const handleReplay = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      await videoRef.current.play()
      setIsPlaying(true)
      setHasEnded(false)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
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
        if (hasEnded) {
          videoRef.current.currentTime = 0
          await videoRef.current.play()
          setIsPlaying(true)
          setHasEnded(false)
        } else if (videoRef.current.paused) {
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
          className={`bg-slate-800/50 rounded-lg flex items-center justify-center ${isMobile ? 'hidden' : ''}`}
          style={{
            width: videoDimensions.width || '640px',
            height: videoDimensions.height || '360px',
            minWidth: '320px',
            minHeight: '180px'
          }}
        >
          <div className="relative w-full h-full">
            <img 
              src="videothumbnail.jpg" 
              alt="Video thumbnail"
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
              <Video className="w-12 h-12 md:w-16 md:h-16 opacity-50" />
              <p className="text-base md:text-lg font-medium mt-4 text-gray-400">No video selected</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div
        ref={containerRef}
        className="bg-slate-950 rounded-lg overflow-hidden relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        style={{
          width: videoDimensions.width || '100%',
          height: videoDimensions.height || '100%'
        }}
      >
        <div className="relative w-full h-full" onClick={togglePlay}>
          {isLoading && (
            <div className="absolute inset-0 z-10">
              <img 
               src="videothumbnail.jpg" 
              alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Video className="w-12 h-12 md:w-16 md:h-16 opacity-50 animate-pulse" />
              </div>
            </div>
          )}
          
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            src={videoUrl}
            playsInline
            controls={false}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
          />

          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-4 py-3 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center gap-3">
              <button
                onClick={hasEnded ? handleReplay : togglePlay}
                className="p-1 hover:opacity-80 transition-opacity bg-transparent"
              >
                {hasEnded ? (
                  <Repeat className="w-6 h-6 text-white" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white" />
                )}
              </button>

              <div className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-1 hover:opacity-80 transition-opacity bg-transparent ml-auto"
              >
                {isFullscreen ? (
                  <Minimize className="w-6 h-6 text-white" />
                ) : (
                  <Maximize className="w-6 h-6 text-white" />
                )}
              </button>
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
      </div>
    </div>
  )
}