'use client';

import React from 'react';
import { Video, Download, Share2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface DemoVideo {
  id: string;
  video_url: string;
  location_count: number;
}

interface DemoVideosProps {
  onVideoSelect: (url: string) => void;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

const DEMO_VIDEOS: DemoVideo[] = [
  {
    id: 'c1c77d31-7485-47ca-855a-b5d2555cd8e6',
    video_url: 'https://ugjwmywvzxkfkohaxseg.supabase.co/storage/v1/object/public/flipbook-videos/flipbook_8536b4e2-0eb6-4dc1-8131-078f97597357_1734258979420.mp4',
    location_count: 12
  },
  {
    id: 'fb1fd4e3-6052-4e96-bc24-5f224a12cc80',
    video_url: 'https://ugjwmywvzxkfkohaxseg.supabase.co/storage/v1/object/public/flipbook-videos/flipbook_8536b4e2-0eb6-4dc1-8131-078f97597357_1734258979420.mp4',
    location_count: 8
  },
  {
    id: '2ad570bb-b09a-4386-a279-3bc7a208401d',
    video_url: 'https://ugjwmywvzxkfkohaxseg.supabase.co/storage/v1/object/public/flipbook-videos/flipbook_8536b4e2-0eb6-4dc1-8131-078f97597357_1734250042604.mp4',
    location_count: 15
  }
];

let toastCounter = 0;

export default function DemoVideos({ onVideoSelect }: DemoVideosProps) {
  const [selectedVideoId, setSelectedVideoId] = React.useState(DEMO_VIDEOS[0].id);
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const initialRenderRef = React.useRef(true);

  // Handle initial video selection only once
  React.useEffect(() => {
    if (initialRenderRef.current) {
      const selectedVideo = DEMO_VIDEOS.find(video => video.id === selectedVideoId);
      if (selectedVideo) {
        onVideoSelect(selectedVideo.video_url);
      }
      initialRenderRef.current = false;
    }
  }, [selectedVideoId, onVideoSelect]);

  const showToast = React.useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = `toast-${++toastCounter}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  const handleDownload = async (videoUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsDownloading(true);
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error('Network response was not ok');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create link without appending to document
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'Mappbook-Adventure-Passport-Demo-Video.mp4';
      
      // Trigger download using click() directly
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      showToast('Video download started');
    } catch (error) {
      console.error('Error downloading video:', error);
      showToast('Failed to download video. Please try again.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = React.useCallback(async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `https://mappbook.com/passport/${videoId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showToast('Failed to copy share link. Please try again.', 'error');
    }
  }, [showToast]);

  const handleVideoSelect = React.useCallback((videoId: string) => {
    setSelectedVideoId(videoId);
    const selectedVideo = DEMO_VIDEOS.find(video => video.id === videoId);
    if (selectedVideo) {
      onVideoSelect(selectedVideo.video_url);
    }
  }, [onVideoSelect]);

  return (
    <div className="mt-6 bg-white/80 rounded-lg border border-gray-100">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Example Videos</span>
      </div>

      <div className="p-2 max-h-[300px] overflow-y-auto">
        {DEMO_VIDEOS.map((video) => (
          <div
            key={video.id}
            className={`w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors
              ${selectedVideoId === video.id ? 'bg-purple-50' : ''}`}
          >
            <button
              onClick={() => handleVideoSelect(video.id)}
              className="flex items-center gap-3 flex-grow min-w-0 text-left"
            >
              <span className="w-16 h-16 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                <Video className={`w-6 h-6 ${selectedVideoId === video.id ? 'text-purple-600' : 'text-purple-500'}`} />
              </span>
              <div className="flex-grow min-w-0">
                <p className={`text-sm font-medium truncate
                  ${selectedVideoId === video.id ? 'text-purple-600' : 'text-gray-700'}`}>
                  Adventure Passport
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {video.location_count} {video.location_count === 1 ? 'Country' : 'Countries'}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDownload(video.video_url, e)}
                className="h-8 w-8 p-0"
                disabled={isDownloading}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleShare(video.id, e)}
                className="h-8 w-8 p-0"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg min-w-[200px] 
              ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}
          >
            <span className="text-sm">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}