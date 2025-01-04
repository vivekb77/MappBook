import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Loader2, XCircle, CheckCircle, Video, Coins } from "lucide-react";
import { getClerkSupabaseClient } from "@/components/utils/supabase";
import { useMappbookUser } from '@/context/UserContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { track } from '@vercel/analytics';

interface Point {
  longitude: number;
  latitude: number;
  altitude: number;
  zoom?: number;
  index: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface ExportButtonProps {
  points: Point[],
  totalDistance: number
}

const ExportButton: React.FC<ExportButtonProps> = ({
  points,
  totalDistance
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [footageId, setFootageId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const supabase = getClerkSupabaseClient();
  const { mappbookUser, setMappbookUser } = useMappbookUser();

  useEffect(() => {
    const fetchCredits = async () => {
      if (isDialogOpen && mappbookUser?.mappbook_user_id) {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('MappBook_Users')
            .select('drone_footage_credits')
            .eq('mappbook_user_id', mappbookUser.mappbook_user_id)
            .single();

          if (error) throw error;

          if (data) {
            setMappbookUser({
              ...mappbookUser,
              drone_footage_credits: data.drone_footage_credits
            });
          }
        } catch (error) {
          console.error('Error fetching credits:', error);
          showToast('Failed to fetch animation credits', 'error');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCredits();
  }, [isDialogOpen, mappbookUser?.mappbook_user_id]);

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

  const handleExport = async () => {
    if (points.length === 0 || !mappbookUser?.drone_footage_credits || mappbookUser.drone_footage_credits <= 0) {
      return false;
    }

    setIsLoading(true);
    try {
      if (!mappbookUser?.mappbook_user_id) {
        throw new Error('Invalid user ID');
      }

      const { data: footageData, error: saveError } = await supabase
        .from('Drone_Footage')
        .insert([{
          points_coordinates_data: points,
          points_count: points.length,
          total_distance: totalDistance,
          mappbook_user_id: mappbookUser.mappbook_user_id,
        }])
        .select('drone_footage_id, points_coordinates_data');

      if (saveError) throw saveError;

      if (!footageData || footageData.length === 0) {
        throw new Error('No footage data returned after insert');
      }

      // Deduct one credit
      const { error: updateError } = await supabase
        .from('MappBook_Users')
        .update({
          drone_footage_credits: mappbookUser.drone_footage_credits - 1
        })
        .eq('mappbook_user_id', mappbookUser.mappbook_user_id);

      if (updateError) throw updateError;

      // Update local state
      setMappbookUser({
        ...mappbookUser,
        drone_footage_credits: mappbookUser.drone_footage_credits - 1
      });

      setFootageId(footageData[0].drone_footage_id);
      setSaveSuccess(true);
      showToast('Footage saved successfully', 'success');
      const event = new CustomEvent('FootageAdded');
      window.dispatchEvent(event);

    } catch (err) {
      track('RED - Drone - Credits data pull from supabase failed', {
        user_id: mappbookUser.mappbook_user_id
      });
      console.error('failed to save:', err);
      showToast('Failed to save', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewFootage = () => {
    if (footageId) {
      setSaveSuccess(false);
      setIsDialogOpen(false);
      window.open(`https://mappbook.com/render/${footageId}`, '_blank');
    } else {
      showToast('Error: Could not load footage viewer', 'error');
      setSaveSuccess(true);
    }
  };

  const isButtonDisabled = points.length <= 2;

  return (
    <>
      <div className="absolute top-2 right-2 z-50 flex space-x-2">
        <Button
          onClick={() => {
            setIsDialogOpen(true);
          }}
          disabled={isButtonDisabled}
          className="bg-gray-800/90 hover:bg-gray-800 text-gray-200 min-w-[140px] border border-gray-700"
        >
          Export
          <Download className="w-6 h-6 text-gray-300" />
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-800 border border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-200">Save & Export</DialogTitle>
            <DialogDescription className="text-gray-400">
              <div className="flex items-center justify-between mb-4">
                <span>
                  {saveSuccess
                    ? ""
                    : "Your drone footage is ready! Click to save, this opens in a new tab where you can create a shareable video recording"
                  }
                </span>
                {!saveSuccess && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-200 font-medium">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        `${mappbookUser?.drone_footage_credits || 0} credits`
                      )}
                    </span>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          {!saveSuccess && (
            <>
              <div className="text-yellow-200 text-sm mb-4">
                Once you save, you won't be able to modify your flight path, waypoints, or camera settings - so make sure to test your complete flight and preview the footage before finalizing.
              </div>
              {typeof mappbookUser?.drone_footage_credits === 'number' && mappbookUser.drone_footage_credits <= 5 && mappbookUser.drone_footage_credits > 0 && (
                <div className="text-yellow-200 text-sm mb-4">
                  Running low on credits! Consider adding more credits.
                </div>
              )}

              {typeof mappbookUser?.drone_footage_credits === 'number' && mappbookUser.drone_footage_credits === 0 && (
                <div className="text-red-400 text-sm mb-4">
                  No credits remaining. Please add credits to Save & Export.
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 mt-4">
            {!saveSuccess ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="text-gray-300 hover:text-gray-200 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={isLoading || !mappbookUser?.drone_footage_credits || mappbookUser.drone_footage_credits <= 0}
                  className="bg-blue-500 hover:bg-blue-600 text-gray-200"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    'Save Footage'
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleViewFootage}
                className="bg-blue-500 hover:bg-blue-600 text-gray-200"
              >
                <Video className="w-4 h-4 mr-2" />
                View Footage
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center p-4 rounded-lg shadow-lg transition-all duration-300 transform cursor-pointer
              ${toast.type === 'success' ? 'bg-blue-500' : 'bg-red-500'} text-gray-200 
              border ${toast.type === 'success' ? 'border-blue-400' : 'border-red-400'}
              min-w-[300px]`}
            onClick={() => removeToast(toast.id)}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <XCircle className="w-5 h-5 mr-2" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="ml-2 hover:opacity-80"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default ExportButton;