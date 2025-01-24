import React, { useState, useEffect, useContext } from 'react';
import { ChevronDown, Loader2, Clock, X, Trash2, Plane, Aperture, Eye } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { getClerkSupabaseClient } from "@/components/utils/supabase";
import { Button } from "@/components/ui/button";
import { useReportContext } from '@/context/ReportContext';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { track } from '@vercel/analytics';

interface FootageHistoryItem {
  report_id: string;
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

const OrderReportHistory = ({ userId }: FootageHistoryProps) => {
  const [footage, setFootage] = useState<FootageHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { setReportData } = useReportContext();
  const [page, setPage] = useState(1);
  const [selectedFootageId, setSelectedFootageId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [footageToDelete, setFootageToDelete] = useState<FootageHistoryItem | null>(null);
  const [selectedFootage, setSelectedFootage] = useState<FootageHistoryItem | null>(null);
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
    fetchOrderReport();
  }, [page]);

  useEffect(() => {
    const handleReportAdded = () => {
      setPage(1);
      fetchOrderReport();
    };

    window.addEventListener('ReportAdded', handleReportAdded);
    return () => window.removeEventListener('ReportAdded', handleReportAdded);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const fetchOrderReport = async () => {
    try {
      setLoading(true);
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('Order_Analytics')
        .select('report_id,created_at', { count: 'exact' })
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
          setSelectedFootageId(data[0].report_id);
        }
      }
    } catch (error) {
      track('RED - Drone - Footage data pull from supabase failed', {
        user_id: userId
      });
      console.error('Error fetching drone footage history:', error);
      showToast('Failed to fetch drone footage history. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFootage?.report_id) {
      showToast('Invalid footage selected', 'error');
      return;
    }

    setFootageToDelete(selectedFootage);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!footageToDelete?.report_id) {
      showToast('Invalid footage selected', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('Order_Analytics')
        .update({ is_deleted: true })
        .eq('report_id', footageToDelete.report_id);

      if (error) throw error;

      setFootage(prev => prev.filter(v => v.report_id !== footageToDelete.report_id));
      showToast('Footage deleted successfully');

      if (selectedFootageId === footageToDelete.report_id) {
        const remainingfootage = footage.filter(v => v.report_id !== footageToDelete.report_id);
        setSelectedFootageId(remainingfootage.length > 0 ? remainingfootage[0].report_id : null);
      }
      setViewDialogOpen(false);
    } catch (error) {
      track('RED - Drone - Delete Footage failed', {
        user_id: userId
      });
      console.error('Error deleting Footage:', error);
      showToast('Failed to delete Footage. Please try again.', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setFootageToDelete(null);
    }
  };

  const handleViewFootage = (foot: FootageHistoryItem) => {
    setSelectedFootage(foot);
    setViewDialogOpen(true);
  };

  const openReportOnMap = async () => {
    
    if (selectedFootage?.report_id) {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('Order_Analytics')
          .select('order_data')
          .eq('report_id', selectedFootage.report_id)
          .single();

        if (error) throw error;

        if (data) {
          setReportData(data.order_data);
        }

      } catch (error) {
        track('RED - Drone - Report data fetch failed', {
          user_id: userId
        });
        console.error('Error fetching report data:', error);
        showToast('Failed to fetch report data. Please try again.', 'error');
      } finally {
        setLoading(false);
        setViewDialogOpen(false);
      }
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
        <div className="flex flex-col items-center justify-center text-gray-400">
          <Aperture size={48} className="text-gray-400" />
          <p className="text-base font-medium mt-4">No Analytics history</p>
          <p className="text-sm mt-1">Your previously uploaded orders will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-6 bg-gray-800/90 rounded-lg overflow-hidden border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-200">Your Order Report history</h3>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="p-2">
          {footage.map((foot) => (
            <div
              key={foot.report_id}
              className={`w-full flex items-center gap-2 p-2 hover:bg-gray-700 rounded-md transition-colors group mb-2 cursor-pointer
`}
              onClick={() => handleViewFootage(foot)}
            >
              <div className="flex-grow flex items-center gap-2 min-w-0">
                <div className="w-12 h-12 md:w-10 md:h-10 bg-gray-200/60 rounded flex items-center justify-center flex-shrink-0">
                  <Aperture />
                </div>
                <div className="flex-grow min-w-0">
                  <p className={`text-xs md:text-sm font-medium truncate
                    ${selectedFootageId === foot.report_id ? 'text-gray-200' : 'text-gray-200'}`}>
                    Report on <span>{formatDate(foot.created_at)}</span>
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <Clock className="w-3 h-3 hidden md:block" />
                    <span className="text-xs">{formatTime(foot.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-400 hidden md:block">
                    {/* {foot.total_orders} orders */}
                  </p>
                </div>
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
        <AlertDialogContent className="bg-gray-800 border border-gray-700 w-4/5 mx-auto rounded-xl">
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

      {/* View Footage Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-gray-800 border border-gray-700 w-4/5 mx-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-200">Details</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-4">
            <Button
              onClick={openReportOnMap}
              className="bg-blue-500 hover:bg-blue-600 text-gray-200"
            >
              <Eye className="w-4 h-4 mr-2" />
              View on Map
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 text-gray-200"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

export default OrderReportHistory;