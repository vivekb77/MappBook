import React from 'react';
import { Laptop, X } from 'lucide-react';

const DesktopRecommendationBanner = () => {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible) return null;

  return (
    <div className="md:hidden relative bg-gradient-to-r from-blue-50 to-pink-50 border border-blue-100 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Laptop className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            <span className="font-medium">For the best experience</span>, please access our website on your desktop computer.
          </p>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 p-1 hover:bg-blue-100 rounded-full transition-colors"
          aria-label="Dismiss message"
        >
          <X className="w-4 h-4 text-blue-400" />
        </button>
      </div>
    </div>
  );
};

export default DesktopRecommendationBanner;