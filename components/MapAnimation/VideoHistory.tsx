import React, { useState, useEffect } from 'react';
import { Plane, ChevronDown, Loader2, Clock, Download, Share2, X, Trash2 } from 'lucide-react';
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

interface FootageHistoryItem {
  drone_footage_id: string;
  total_distance: number;
  created_at: string;
}

interface FootageHistoryProps {
  userId: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const FootageHistory = ({ userId }: FootageHistoryProps) => {
  const [footage, setFootage] = useState<FootageHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedFootageId, setSelectedFootageId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [footageToDelete, setFootageToDelete] = useState<FootageHistoryItem | null>(null);
  const supabase = getClerkSupabaseClient();
  const PAGE_SIZE = 5;
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  useEffect(() => {
    fetchFootage();
  }, [page]);


  // Listen for footage creation events
  useEffect(() => {
    const handleFootageAdded = () => {
      // Reset to first page and refetch
      setPage(1);
      fetchFootage();
    };

    window.addEventListener('FootageAdded', handleFootageAdded);
    return () => window.removeEventListener('FootageAdded', handleFootageAdded);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };


  const fetchFootage = async () => {
    try {
      setLoading(true);
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('Drone_Footage')
        .select('*', { count: 'exact' })
        .eq('mappbook_user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      if (data) {
        setHasMore(count ? start + PAGE_SIZE < count : false);

        if (page === 1) {
          setFootage(data);
        } else {
          setFootage(prev => [...prev, ...data]);
        }

        if (!selectedFootageId && data.length > 0) {
          setSelectedFootageId(data[0].drone_footage_id);
        }
      }
    } catch (error) {
      console.error('Error fetching drone footage history:', error);
      showToast('Failed to fetch drone footage history. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (
    foot: FootageHistoryItem,
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();

    if (!foot.drone_footage_id) {
      showToast('Invalid footage selected', 'error');
      return;
    }

    setFootageToDelete(foot);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!footageToDelete?.drone_footage_id) {
      showToast('Invalid footage selected', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('Drone_Footage')
        .update({ is_deleted: true })
        .eq('drone_footage_id', footageToDelete.drone_footage_id);

      if (error) throw error;

      // Update local state
      setFootage(prev => prev.filter(v => v.drone_footage_id !== footageToDelete.drone_footage_id));
      showToast('Footage deleted successfully');

      // Update selected footage if needed
      if (selectedFootageId === footageToDelete.drone_footage_id) {
        const remainingfootage = footage.filter(v => v.drone_footage_id !== footageToDelete.drone_footage_id);
        setSelectedFootageId(remainingfootage.length > 0 ? remainingfootage[0].drone_footage_id : null);
      }
    } catch (error) {
      console.error('Error deleting Footage:', error);
      showToast('Failed to delete Footage. Please try again.', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setFootageToDelete(null);
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



  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  if (footage.length === 0 && !loading) {
    return (
      <div className="mt-6 bg-gray-800/90 rounded-lg overflow-hidden border border-gray-700 p-8">
        <div className="text-center text-gray-400">
          <Plane className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <p className="text-sm font-medium">No footage history</p>
          <p className="text-xs mt-1">Your previously created footage will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-6 bg-gray-800/90 rounded-lg overflow-hidden border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-200">Your footage</h3>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="p-2">
          {footage.map((foot) => (
            <div
              key={foot.drone_footage_id}
              className={`w-full flex items-center gap-2 p-2 hover:bg-gray-700 rounded-md transition-colors group mb-2
                ${selectedFootageId === foot.drone_footage_id ? 'bg-gray-700/80' : ''}`}
            >
              <button
                className="flex-grow flex items-center gap-2 min-w-0"
              >
                <div className="w-5 h-5 md:w-5 md:h-5 bg-gray-700/60 rounded flex items-center justify-center flex-shrink-0">
                  <Plane className={`w-5 h-5 md:w-5 md:h-5 ${selectedFootageId === foot.drone_footage_id ? 'text-blue-400' : 'text-blue-500'}`} />
                </div>
                <div className="flex-grow min-w-0 text-left">
                  <p className={`text-xs md:text-sm font-medium truncate
                    ${selectedFootageId === foot.drone_footage_id ? 'text-blue-400' : 'text-gray-200'}`}>
                    Footage on <span>{formatDate(foot.created_at)}</span>
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <Clock className="w-3 h-3 hidden md:block" />
                    <span className="text-xs">{formatTime(foot.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-400 hidden md:block">
                    {foot.total_distance} km
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  // onClick={(e) => openFootage(foot.drone_footage_id)}
                  className="h-8 w-8 p-0 text-gray-300 hover:text-blue-400 hover:bg-gray-700"
                >
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDelete(foot, e)}
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-gray-700"
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
              className="mt-2 w-full py-2 px-4 text-xs md:text-sm font-medium text-gray-300 
                hover:text-blue-400 flex items-center justify-center gap-2 
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
        <AlertDialogContent className="bg-gray-800 border border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-200">Delete Footage</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this footage?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-500 hover:bg-red-600 text-gray-200"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center justify-between p-4 rounded-lg shadow-lg min-w-[200px] 
              ${toast.type === 'success' ? 'bg-blue-500' : 'bg-red-500'} text-gray-200 border
              ${toast.type === 'success' ? 'border-blue-400' : 'border-red-400'}`}
          >
            <span className="text-sm">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-gray-200 hover:text-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FootageHistory;