import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FullscreenButtonProps {
  containerId: string;
}

const FullscreenButton: React.FC<FullscreenButtonProps> = ({ containerId }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    const mapContainer = document.getElementById(containerId);
    if (!mapContainer) return;

    if (!document.fullscreenElement) {
      mapContainer.requestFullscreen().catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.log('Error attempting to exit fullscreen:', err);
      });
    }
  };

  return (
    <Button
      onClick={toggleFullscreen}
      className="fixed right-4 top-4 z-50 bg-gray-800/90 hover:bg-gray-700/90"
      size="icon"
      variant="outline"
    >
      {isFullscreen ? (
        <Minimize2 className="h-5 w-5" />
      ) : (
        <Maximize2 className="h-5 w-5" />
      )}
    </Button>
  );
};

export default FullscreenButton;