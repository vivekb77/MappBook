import React, { useState } from 'react';
import { Forward } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const ShareButton = () => {
  const [showCopied, setShowCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
<div className="absolute top-60 right-2">
      <button
        onClick={handleShare}
        className="bg-gray-800/90 p-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors border border-gray-700"
        title="Share"
      >
        <Forward className="w-6 h-6 text-gray-300" />
      </button>
      
      {showCopied && (
        <div className="absolute right-0 mt-2 w-48">
          <Alert className="bg-gray-800/90 border-gray-700">
            <AlertDescription className="text-gray-300">
              URL copied - share away!
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default ShareButton;