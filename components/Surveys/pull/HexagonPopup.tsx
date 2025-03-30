// components/HexagonPopup.tsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

// Team data interface
interface TeamData {
  team: string;
  count: number;
  percentage: number;
}

interface HexagonData {
  teams: TeamData[];
  total_fans: number;
  home_hexagon: number;
  dominant_team: string;
  dominance_percentage: number;
}

interface PopupPosition {
  x: number;
  y: number;
}

interface HexagonPopupProps {
  popupData: HexagonData;
  position: PopupPosition;
  viewBox: {
    width: number;
    height: number;
  };
  onClose: () => void;
  teamColors: Record<string, string>;
}

const HexagonPopup: React.FC<HexagonPopupProps> = ({
  popupData,
  position,
  viewBox,
  onClose,
  teamColors
}) => {
  // State to track if we're on a mobile device
  const [isMobile, setIsMobile] = useState(false);
  // Ref for the popup container
  const popupRef = useRef<HTMLDivElement>(null);
  // State to track if content needs scrolling
  const [needsScroll, setNeedsScroll] = useState(false);
  
  // Check viewport size on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Calculate dynamic width based on device
  const popupWidth = isMobile ? 320 : 400;
  
  // Check if content needs scrolling
  useEffect(() => {
    const checkScrollNeeded = () => {
      if (popupRef.current) {
        const viewportHeight = window.innerHeight;
        const popupHeight = popupRef.current.getBoundingClientRect().height;
        
        // Add some padding to account for positioning
        setNeedsScroll(popupHeight + 40 > viewportHeight);
      }
    };
    
    // Check on mount and when data changes
    checkScrollNeeded();
    
    // Also check when window is resized
    window.addEventListener('resize', checkScrollNeeded);
    
    return () => window.removeEventListener('resize', checkScrollNeeded);
  }, [popupData]);
  
  // Handler for outside clicks
  const handleOutsideClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the overlay
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Use createPortal to render the popup outside the SVG for proper z-index handling
  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-start justify-end p-2"
      onClick={handleOutsideClick}
    >
      <div 
        className="pointer-events-auto max-h-screen flex flex-col"
        style={{ width: popupWidth + 'px' }}
        ref={popupRef}
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col max-h-full">
          {/* Header - fixed position */}
          <div className="bg-blue-700 px-6 py-4 relative">
            <h2 className="text-center text-white font-bold text-x md:text-xl">
              Region {popupData.home_hexagon}
            </h2>
            
            {/* Close button */}
            <button 
              onClick={onClose}
              className="absolute top-2 right-2 bg-white bg-opacity-30 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-40 transition-colors"
            >
              <span className="text-2xl font-bold leading-none">&times;</span>
            </button>
          </div>
          
          {/* Content - scrollable area */}
          <div className={`p-6 ${needsScroll ? 'overflow-y-auto' : ''}`} style={{ maxHeight: needsScroll ? 'calc(100vh - 120px)' : 'none' }}>
            {/* Total Fans */}
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800 text-x md:text-x">Total Fans:</span>
              <span className="font-bold text-gray-800 text-x md:text-x">
                {popupData.total_fans.toLocaleString()}
              </span>
            </div>
            
            {/* Divider */}
            <hr className="my-4 border-gray-200" />
           
            {/* Team breakdown with name and bar stacked vertically */}
            <div className="space-y-6">
              {popupData.teams.map((team, index) => (
                <div key={`team-${index}`} className="space-y-1">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 md:w-5 md:h-5 rounded-full mr-2"
                      style={{ backgroundColor: teamColors[team.team] || "#cccccc" }}
                    ></div>
                    <span className="text-sm md:text-base text-gray-800">
                      {team.team} - {team.count.toLocaleString()} ({team.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2 md:h-2.5">
                    <div 
                      className="h-2 md:h-2.5 rounded-full" 
                      style={{ 
                        width: `${team.percentage}%`,
                        backgroundColor: teamColors[team.team] || "#cccccc", 
                        minWidth: '4px'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HexagonPopup;