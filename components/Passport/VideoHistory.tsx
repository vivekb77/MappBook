import React, { useState, useEffect } from 'react';
import { Video, ChevronDown, Loader2, Clock, Download, Share2, X, Trash2 } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { getClerkSupabaseClient } from "@/components/utils/supabase";
import { Button } from "@/components/ui/button";
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
  id: string;
  video_url: string;
  location_count: number;
  created_at: string;
}

interface VideoHistoryProps {
  userId: string;
  onVideoSelect: (url: string) => void;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const VideoHistory = ({ userId, onVideoSelect }: VideoHistoryProps) => {
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

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('FlipBook_Video')
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
          setSelectedVideoId(data[0].id);
          onVideoSelect(data[0].video_url);
        }
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      showToast('Failed to fetch videos. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (video: VideoHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoToDelete(video);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;

    try {
      const { error } = await supabase
        .from('FlipBook_Video')
        .update({ is_deleted: true })
        .eq('id', videoToDelete.id);

      if (error) throw error;

      setVideos(prev => prev.filter(v => v.id !== videoToDelete.id));
      showToast('Video deleted successfully');

      if (selectedVideoId === videoToDelete.id) {
        const remainingVideos = videos.filter(v => v.id !== videoToDelete.id);
        if (remainingVideos.length > 0) {
          setSelectedVideoId(remainingVideos[0].id);
          onVideoSelect(remainingVideos[0].video_url);
        } else {
          setSelectedVideoId(null);
        }
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      showToast('Failed to delete video. Please try again.', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [page]);

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
    setSelectedVideoId(video.id);
    onVideoSelect(video.video_url);
  };

  const handleDownload = async (videoUrl: string, created_at: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Mappbook-Adventure-Passport-${formatDate(created_at)}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showToast('Video download started');
    } catch (error) {
      console.error('Error downloading video:', error);
      showToast('Failed to download video. Please try again.', 'error');
    }
  };

  const handleShare = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `https://mappbook.com/passport/${videoId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showToast('Failed to copy share link. Please try again.', 'error');
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
              key={video.id}
              className={`w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors group mb-2
                ${selectedVideoId === video.id ? 'bg-purple-50' : ''}`}
            >
              <button
                onClick={() => handleVideoSelect(video)}
                className="flex-grow flex items-center gap-3 min-w-0"
              >
                <div className="w-16 h-16 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                  <Video className={`w-6 h-6 ${selectedVideoId === video.id ? 'text-purple-600' : 'text-purple-500'}`} />
                </div>
                <div className="flex-grow min-w-0 text-left">
                  <p className={`text-sm font-medium truncate
                    ${selectedVideoId === video.id ? 'text-purple-600' : 'text-gray-700'}`}>
                    Adventure Passport
                  </p>
                  <p className="text-xs text-gray-500">
                    {video.location_count} Countries{video.location_count !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(video.created_at)}</span>
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
                {/* <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleShare(video.id, e)}
                  className="h-8 w-8 p-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button> */}
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
                hover:text-purple-500 flex items-center justify-center gap-2 
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

      {/* Delete Confirmation Dialog */}
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

      {/* Toast Container */}
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