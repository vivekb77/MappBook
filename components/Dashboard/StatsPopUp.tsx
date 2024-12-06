import React, { useState } from 'react';
import { BarChart, Share2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMappbookUser } from '@/context/UserContext';
import { track } from '@vercel/analytics';

const StatsPopUp = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { mappbookUser } = useMappbookUser();

  const handleCopy = async () => {
    try {
      track('Create Map - Copy share url button clicked on Stats Popup');

      await navigator.clipboard.writeText(`https://mappbook.com/map/${mappbookUser?.mappbook_user_id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      track('RED - Copy share url button does not work on Stats Popup');
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-xl bg-white/80 text-purple-500 hover:bg-purple-50 transition-colors duration-300"
      >
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <BarChart className="w-4 h-4" />
            <span className="text-sm font-medium">
              Stats
            </span>
          </div>
        </div>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] sm:w-[440px] rounded-2xl bg-gradient-to-br from-pink-100 to-purple-50 p-0 border-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-semibold text-center bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              {mappbookUser?.display_name}'s Mappbook Stats
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            <div className="bg-white/80 rounded-xl p-4 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total MappBook Views</span>
                  <span className="font-medium text-purple-600">
                    {!mappbookUser?.is_premium_user 
                      ? "?" 
                      : mappbookUser.total_map_views}
                  </span>
                </div>
                {/* <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Views Remaining</span>
                  <span className="font-medium text-purple-600">
                    {mappbookUser?.map_views_left || 0}
                  </span>
                </div> */}
              </div>
            </div>
            
            {!mappbookUser?.is_premium_user && (
              <div className="bg-white/80 rounded-xl p-4 text-center shadow-sm">
                <div className="text-sm text-purple-500">
                  ✨ Upgrade to Premium to see stats.
                </div>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm font-medium text-purple-500 mb-2">
                Show off your travel map with friends! ✈️
              </p>
              <button 
                onClick={handleCopy}
                className="w-full py-3 px-4 rounded-xl font-medium
                  bg-white/80 border border-pink-100 text-gray-700
                  hover:bg-white hover:shadow-md transform transition-all duration-300
                  flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5 text-purple-400" />
                <span>{copied ? 'Copied!' : 'Share Your #MappBook'}</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StatsPopUp;