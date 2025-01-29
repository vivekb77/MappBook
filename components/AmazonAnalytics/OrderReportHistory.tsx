import React, { useState, useEffect } from 'react';
import { ChevronDown, Loader2, Clock, X, Trash2, Aperture } from 'lucide-react';
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
import { track } from '@vercel/analytics';
import { useUser } from '@clerk/nextjs';

interface FootageHistoryItem {
  report_id: string;
  created_at: string;
  total_orders_in_report: number;
  total_orders_processed_from_report: number
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
  const { isLoaded, isSignedIn, user } = useUser();
  const { setReportData } = useReportContext();
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [footageToDelete, setFootageToDelete] = useState<FootageHistoryItem | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
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
    const handleReportAdded = async () => {
      setPage(1);
      const { data } = await supabase
        .from('Amazon_Order_Analytics')
        .select('report_id,created_at,total_orders_in_report,total_orders_processed_from_report')
        .eq('mappbook_user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (data && data.length > 0) {
        setFootage(data);
        setSelectedReport(data[0].report_id);
        
        // First open the report to get the new data
        const newReportData = await openReportOnMap(data[0]);
        
        // Then dispatch reset event with the new data
        window.dispatchEvent(new CustomEvent('resetOrderFilters', { 
          detail: newReportData 
        }));
      }
    };

    window.addEventListener('ReportAdded', handleReportAdded);
    return () => window.removeEventListener('ReportAdded', handleReportAdded);
    
}, []);


  useEffect(() => {
    if (footage.length > 0 && !selectedReport) {
      const firstReport = footage[0];
      setSelectedReport(firstReport.report_id);
      openReportOnMap(firstReport);
    }
  }, [footage]);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const fetchOrderReport = async () => {
    try {
      setLoading(true);
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('Amazon_Order_Analytics')
        .select('report_id,created_at,total_orders_in_report,total_orders_processed_from_report', { count: 'exact' })
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
      }
    } catch (error) {
      track('RED - Amazon - Report data pull from supabase failed', {
        user_id: userId
      });
      console.error('Error fetching amazon report history:', error);
      showToast('Failed to fetch amazon report history. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (foot: FootageHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setFootageToDelete(foot);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!footageToDelete?.report_id) {
      showToast('Invalid report selected', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('Amazon_Order_Analytics')
        .update({ is_deleted: true })
        .eq('report_id', footageToDelete.report_id);

      if (error) throw error;

      setFootage(prev => prev.filter(v => v.report_id !== footageToDelete.report_id));
      showToast('Report deleted successfully');
    } catch (error) {
      track('RED - Amazon - Delete Report failed', {
        user_id: userId
      });
      console.error('Error deleting report:', error);
      showToast('Failed to delete report. Please try again.', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setFootageToDelete(null);
    }
  };

  const openReportOnMap = async (foot: FootageHistoryItem) => {
    setSelectedReport(foot.report_id);
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('Amazon_Order_Analytics')
        .select('order_data')
        .eq('report_id', foot.report_id)
        .single();

      if (error) throw error;

      if (data) {
        window.dispatchEvent(new Event('resetOrderFilters'));
        setReportData(data.order_data);
      }
    } catch (error) {
      track('RED - Amazon - Report data fetch failed', {
        user_id: userId
      });
      console.error('Error fetching report data:', error);
      showToast('Failed to fetch report data. Please try again.', 'error');
    } finally {
      setLoading(false);
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
          <p className="text-base font-medium mt-4">No Report history</p>
          <p className="text-sm mt-1">Your previously uploaded order reports will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-6 bg-gray-800/90 rounded-lg overflow-hidden border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-200">Order Report History</h3>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="p-2">
          {footage.map((foot) => (
            <div
              key={foot.report_id}
              className={`w-full flex items-center gap-2 p-2 rounded-md transition-colors group mb-2 cursor-pointer ${selectedReport === foot.report_id ? 'bg-gray-900' : 'hover:bg-gray-700'}`}
              onClick={() => openReportOnMap(foot)}
            >
              <div className="flex-grow flex items-center gap-2 min-w-0">
                <div className="w-14 h-14 md:w-10 md:h-10 bg-gray-200/60 rounded flex items-center justify-center flex-shrink-0">
                  <Aperture />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-xs md:text-sm font-medium truncate text-gray-200">
                    Order Report - <span>{formatDate(foot.created_at)}</span>
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <Clock className="w-3 h-3 hidden md:block" />
                    <span className="text-xs">{formatTime(foot.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <span className="text-xs">Total Orders {foot.total_orders_processed_from_report} / {foot.total_orders_in_report}</span>
                  </div>
                </div>
              </div>

              {isSignedIn && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={(e) => handleDelete(foot, e)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>)}
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
            <AlertDialogTitle className="text-gray-200">Delete Report</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this report?
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