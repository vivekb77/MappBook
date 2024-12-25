import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Loader2, XCircle, CheckCircle } from "lucide-react";
import { getClerkSupabaseClient } from "@/components/utils/supabase";
import { useMappbookUser } from '@/context/UserContext';

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
  points: Point[];
  onExportComplete?: () => void;
  onVideoCreated?: () => void; // New prop for refreshing videos
}

type RenderingStatus = 'idle' | 'saving' | 'rendering' | 'complete' | 'error';

const ExportButton: React.FC<ExportButtonProps> = ({ 
  points, 
  onExportComplete, 
  onVideoCreated 
}) => {
  const [renderingStatus, setRenderingStatus] = useState<RenderingStatus>('idle');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const supabase = getClerkSupabaseClient();
  const { mappbookUser } = useMappbookUser();

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
    if (points.length === 0) {
      return false;
    }
  
    setRenderingStatus('saving');
    try {
      if (!mappbookUser?.mappbook_user_id) {
        throw new Error('Invalid user ID');
      }

      // First save to Animation_Data table
      const { data: animationData, error: saveError } = await supabase
        .from('Animation_Data')
        .insert([{
          location_data: points, 
          mappbook_user_id: mappbookUser.mappbook_user_id
        }])
        .select();

      if (saveError) throw saveError;

      const animationDataId = animationData[0].animation_data_id;

      // Start the render
      const response = await fetch('/api/remotion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ points }),
      });

      if (!response.ok) {
        throw new Error('Failed to start render');
      }

      const { renderId, bucketName } = await response.json();

      // Start polling for progress
      const checkProgress = async () => {
        try {
          const progressResponse = await fetch(`/api/remotion?renderId=${renderId}&bucketName=${bucketName}`);
          const progress = await progressResponse.json();

          if (progress.done) {
            // Save video URL to Animation_Video table
            const { error: videoError } = await supabase
              .from('Animation_Video')
              .insert([{
                video_url: progress.outputFile,
                mappbook_user_id: mappbookUser.mappbook_user_id,
                animation_data_id: animationDataId,
                location_count: points.length,
                video_cost: progress.costs.accruedSoFar
              }]);

            if (videoError) throw videoError;

            setRenderingStatus('complete');
            showToast('Video created successfully!', 'success');
            onExportComplete?.();
            
            // Dispatch custom event for video creation
            const event = new CustomEvent('videoCreated');
            window.dispatchEvent(event);
            return;
          } else if (progress.error) {
            throw new Error(progress.error);
          } else {
            setRenderingStatus('rendering');
            setTimeout(checkProgress, 10000);
          }
        } catch (error) {
          console.error('Progress check error:', error);
          setRenderingStatus('error');
          showToast('Error during video rendering', 'error');
        }
      };

      await checkProgress();
    } catch (err) {
      console.error('Export error:', err);
      setRenderingStatus('error');
      showToast('Failed to create video', 'error');
      return false;
    }
  };

  const getButtonText = () => {
    switch (renderingStatus) {
      case 'saving':
        return 'Saving...';
      case 'rendering':
        return 'Rendering...';
      case 'complete':
        return 'Save & Export';
      case 'error':
        return 'Failed';
      default:
        return 'Save & Export';
    }
  };

  const isLoading = renderingStatus === 'saving' || renderingStatus === 'rendering';
  const isDisabled = points.length === 0 || isLoading;

  return (
    <>
      <div className="absolute top-4 right-4 z-50 flex space-x-2">
        <Button
          onClick={handleExport}
          disabled={isDisabled}
          className="bg-blue-500 hover:bg-blue-600 text-white min-w-[140px]"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {getButtonText()}
        </Button>
      </div>

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center p-4 rounded-lg shadow-lg transition-all duration-300 transform cursor-pointer
              ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white min-w-[300px]`}
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