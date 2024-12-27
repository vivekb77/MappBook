import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Loader2, XCircle, CheckCircle, Video } from "lucide-react";
import { getClerkSupabaseClient } from "@/components/utils/supabase";
import { useMappbookUser } from '@/context/UserContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup } from '@radix-ui/react-dropdown-menu';

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
  onVideoCreated?: () => void;
}

interface AspectRatioOption {
  aspectRatio: string;
  platforms: string[];
}

const aspectRatioOptions: AspectRatioOption[] = [
  {
    aspectRatio: "9:16",
    platforms: [
      "Instagram Stories / Reels",
      "Facebook Stories",
      "TikTok"
    ]
  },
  {
    aspectRatio: "4:5",
    platforms: [
      "Instagram Feed Videos",
      "Twitter"
    ]
  }
];
type RenderingStatus = 'idle' | 'saving' | 'rendering' | 'complete' | 'error';

const ExportButton: React.FC<ExportButtonProps> = ({ 
  points, 
  onExportComplete, 
  onVideoCreated 
}) => {
  const [renderingStatus, setRenderingStatus] = useState<RenderingStatus>('idle');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>("9:16");
  
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
    setIsDialogOpen(false);
    
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

      // Start the render with aspect ratio
      const response = await fetch('/api/remotion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          points,
          aspectRatio: selectedAspectRatio 
        }),
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
            const { error: videoError } = await supabase
              .from('Animation_Video')
              .insert([{
                video_url: progress.outputFile,
                mappbook_user_id: mappbookUser.mappbook_user_id,
                animation_data_id: animationDataId,
                location_count: points.length,
                video_cost: progress.costs.accruedSoFar,
                aspect_ratio: selectedAspectRatio
              }]);

            if (videoError) throw videoError;

            setRenderingStatus('complete');
            showToast('Video created successfully!', 'success');
            onExportComplete?.();
            
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
          onClick={() => setIsDialogOpen(true)}
          disabled={isDisabled}
          className="bg-gray-800/90 hover:bg-gray-800 text-gray-200 min-w-[140px] border border-gray-700"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {getButtonText()}
        </Button>
      </div>

      {/* Export Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-800 border border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-200">Create Animation Video</DialogTitle>
            <DialogDescription className="text-gray-400">
              The video will be created on the server, after completion it will appear in your Videos section for you to Download
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <RadioGroup 
              value={selectedAspectRatio} 
              onValueChange={setSelectedAspectRatio}
              className="grid grid-cols-2 gap-4"
            >
              {aspectRatioOptions.map((option) => (
                <div 
                  key={option.aspectRatio}
                  className={`relative p-4 rounded-lg border cursor-pointer
                    ${selectedAspectRatio === option.aspectRatio 
                      ? 'border-blue-500 bg-gray-700/50' 
                      : 'border-gray-700 bg-gray-900/50 hover:bg-gray-700/30'}
                    transition-colors`}
                  onClick={() => setSelectedAspectRatio(option.aspectRatio)}
                >
                  <div className="flex flex-col items-center gap-4">
                    {/* Visual representation of aspect ratio */}
                    <div className={`relative ${
                      option.aspectRatio === "9:16" 
                        ? "w-12 h-20" 
                        : "w-16 h-20"
                    } bg-gray-700 rounded-lg border border-gray-600`} />
                    
                    <div className="text-center">
                      <p className="text-gray-200 font-medium">{option.aspectRatio}</p>
                      <div className="mt-2 text-sm text-gray-400">
                        <p className="font-medium mb-1">Perfect for:</p>
                        <ul className="space-y-1">
                          {option.platforms.map((platform, idx) => (
                            <li key={idx} className="text-xs">
                              • {platform}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="ghost"
              onClick={() => setIsDialogOpen(false)}
              className="text-gray-300 hover:text-gray-200 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-gray-200"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                'Create Video'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Toast notifications */}
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