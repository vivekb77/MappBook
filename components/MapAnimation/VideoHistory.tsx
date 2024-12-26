import React, { useState, useEffect } from 'react';
import { Video, ChevronDown, Loader2, Clock, Download, Share2, X, Trash2 } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { getClerkSupabaseClient } from "@/components/utils/supabase";
import { Button } from "@/components/ui/button";
import { Player } from '@remotion/player';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VideoHistoryItem {
  animation_video_id: string;  // Updated from 'id'
  video_url: string;
  location_count: number;
  created_at: string;
}
interface VideoHistoryProps {
  userId: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const VideoHistory = ({ userId }: VideoHistoryProps) => {
  const [videos, setVideos] = useState<VideoHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<VideoHistoryItem | null>(null);
  const supabase = getClerkSupabaseClient();
  const PAGE_SIZE = 5;
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoHistoryItem | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  useEffect(() => {
    fetchVideos();
  }, [page]);


  // Listen for video creation events
  useEffect(() => {
    const handleVideoCreated = () => {
      // Reset to first page and refetch
      setPage(1);
      fetchVideos();
    };

    window.addEventListener('videoCreated', handleVideoCreated);
    return () => window.removeEventListener('videoCreated', handleVideoCreated);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };


  const fetchVideos = async () => {
    try {
      setLoading(true);
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('Animation_Video')
        .select('*', { count: 'exact' })
        .eq('mappbook_user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      if (data) {
        setHasMore(count ? start + PAGE_SIZE < count : false);

        if (page === 1) {
          setVideos(data);
        } else {
          setVideos(prev => [...prev, ...data]);
        }

        if (!selectedVideoId && data.length > 0) {
          setSelectedVideoId(data[0].animation_video_id);
        }
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      showToast('Failed to fetch videos. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (
    video: VideoHistoryItem,
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();

    if (!video.animation_video_id) {
      showToast('Invalid video selected', 'error');
      return;
    }

    setVideoToDelete(video);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!videoToDelete?.animation_video_id) {
      showToast('Invalid video selected', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('Animation_Video')
        .update({ is_deleted: true })
        .eq('animation_video_id', videoToDelete.animation_video_id);

      if (error) throw error;

      // Update local state
      setVideos(prev => prev.filter(v => v.animation_video_id !== videoToDelete.animation_video_id));
      showToast('Video deleted successfully');

      // Update selected video if needed
      if (selectedVideoId === videoToDelete.animation_video_id) {
        const remainingVideos = videos.filter(v => v.animation_video_id !== videoToDelete.animation_video_id);
        setSelectedVideoId(remainingVideos.length > 0 ? remainingVideos[0].animation_video_id : null);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      showToast('Failed to delete video. Please try again.', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleVideoSelect = (video: VideoHistoryItem) => {
    setSelectedVideoId(video.animation_video_id);
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  const handleDownload = async (
    videoUrl: string,
    created_at: string,
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();
    let downloadLink: HTMLAnchorElement | null = null;

    try {
      // Add no-cors mode and necessary headers
      const response = await fetch(videoUrl, {
        mode: 'cors',
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });

      if (!response.ok && response.status !== 0) { // Status 0 is normal for opaque responses
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // For opaque responses, redirect to the video URL directly
      if (response.status === 0 || response.type === 'opaque') {
        downloadLink = document.createElement('a');
        downloadLink.href = videoUrl;
        downloadLink.target = '_blank';
        downloadLink.download = `Mappbook-Animation-${formatDate(created_at)}.mp4`;
        downloadLink.rel = 'noopener noreferrer';
        document.body.appendChild(downloadLink);
        downloadLink.click();

        showToast('Video download started');
        return;
      }

      // If CORS is allowed, proceed with blob download
      const blob = await response.blob();
      if (!blob) {
        throw new Error('Failed to create blob from video');
      }

      const url = window.URL.createObjectURL(blob);
      downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `Mappbook-Animation-${formatDate(created_at)}.mp4`;
      downloadLink.rel = 'noopener noreferrer';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      showToast('Video download started');
    } catch (error) {
      console.error('Error downloading video:', error);
      // Try direct download as fallback
      try {
        downloadLink = document.createElement('a');
        downloadLink.href = videoUrl;
        downloadLink.target = '_blank';
        downloadLink.download = `Mappbook-Animation-${formatDate(created_at)}.mp4`;
        downloadLink.rel = 'noopener noreferrer';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        showToast('Video download started');
      } catch (fallbackError) {
        showToast('Failed to download video. Please try again.', 'error');
      }
    } finally {
      if (downloadLink) {
        // Clean up
        setTimeout(() => {
          if (downloadLink) {
            if (downloadLink.href.startsWith('blob:')) {
              URL.revokeObjectURL(downloadLink.href);
            }
            document.body.removeChild(downloadLink);
          }
        }, 100);
      }
    }
  };



  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  if (videos.length === 0 && !loading) {
    return (
      <div className="mt-6 bg-white/80 rounded-lg overflow-hidden border border-gray-100 p-8">
        <div className="text-center text-gray-500">
          <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm font-medium">No video history</p>
          <p className="text-xs mt-1">Your previously created videos will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-6 bg-white/80 rounded-lg overflow-hidden border border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Your Videos</h3>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="p-2">
          {videos.map((video) => (
            <div
              key={video.animation_video_id}
              className={`w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors group mb-2
                ${selectedVideoId === video.animation_video_id ? 'bg-blue-100' : ''}`}
            >
              <button
                onClick={() => handleVideoSelect(video)}
                className="flex-grow flex items-center gap-3 min-w-0"
              >
                <div className="w-16 h-16 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <Video className={`w-6 h-6 ${selectedVideoId === video.animation_video_id ? 'text-blue-700' : 'text-blue-500'}`} />
                </div>
                <div className="flex-grow min-w-0 text-left">
                  <p className={`text-sm font-medium truncate
                    ${selectedVideoId === video.animation_video_id ? 'text-blue-700' : 'text-gray-700'}`}>
                    Footage
                  </p>
                  <p className="text-xs text-gray-500">
                    {video.location_count} Points{video.location_count !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(video.created_at)} at {formatTime(video.created_at)}</span>
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDownload(video.video_url, video.created_at, e)}
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDelete(video, e)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="mt-2 w-full py-2 px-4 text-sm font-medium text-gray-600 
                hover:text-blue-500 flex items-center justify-center gap-2 
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {loading ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Video Modal */}
      {isVideoModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-[80vw] max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Footage</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVideoModalOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative aspect-video">
              <Player
                component={() => (
                  <video
                    src={selectedVideo.video_url}
                    controls
                    className="w-full h-full"
                  />
                )}
                durationInFrames={1000}
                compositionWidth={1920}
                compositionHeight={1080}
                fps={30}
                style={{
                  width: '100%',
                  height: '100%',
                }}
              />
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>{selectedVideo.location_count} Points{selectedVideo.location_count !== 1 ? 's' : ''}</p>
              <p>Created on {formatDate(selectedVideo.created_at)} at {formatTime(selectedVideo.created_at)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center justify-between p-4 rounded-lg shadow-lg min-w-[200px] 
              ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}
          >
            <span className="text-sm">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-white hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoHistory;