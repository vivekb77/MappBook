import React from 'react';

interface PageLoadingAnimationProps {
  isDarkMode: boolean;
}

const PageLoadingAnimation: React.FC<PageLoadingAnimationProps> = ({ isDarkMode }) => {
  // Size will adjust based on container but maintain proportions
  const size = 70;
  const dotSize = 8;
  const hexPoints = calculateHexagonPoints(size);
  
  return (
    <div className={`fixed inset-0 flex items-center justify-center ${
      isDarkMode ? 'bg-slate-950' : 'bg-gray-50'
    }`}>
      <div className="relative h-[15vh] w-[15vh] min-h-24 min-w-24 max-h-40 max-w-40 flex items-center justify-center">
        {/* Static Hexagon Border */}
        <svg className="absolute" width={size * 2} height={size * 2} viewBox={`0 0 ${size * 2} ${size * 2}`}>
          <polygon 
            points={hexPoints} 
            fill="none" 
            stroke={isDarkMode ? "#4B5563" : "#D1D5DB"} // gray-600 for dark, gray-300 for light
            strokeWidth="6" 
            className="origin-center"
          />
        </svg>
        
        {/* Inner Hexagon - Subtle fill */}
        <svg className="absolute" width={size * 2} height={size * 2} viewBox={`0 0 ${size * 2} ${size * 2}`}>
          <polygon 
            points={hexPoints} 
            fill={isDarkMode ? "#374151" : "#F3F4F6"} // gray-700 for dark, gray-100 for light
            stroke="none"
            className="origin-center"
            transform={`scale(0.85)`}
            style={{ transformOrigin: 'center' }}
          />
        </svg>
        
        {/* Traveling Dot */}
        <svg 
          className="absolute animate-spin" 
          width={size * 2} 
          height={size * 2} 
          viewBox={`0 0 ${size * 2} ${size * 2}`}
          style={{ animationDuration: '2s' }}
        >
          <circle 
            cx={size * 2 - dotSize - 5} 
            cy={size} 
            r={dotSize} 
            fill={isDarkMode ? "#6366F1" : "#4F46E5"} // indigo-500 for dark, indigo-600 for light
            className="origin-center drop-shadow-lg"
          />
        </svg>
        
        {/* MappBook logo text */}
        <div className={`absolute mt-2 font-semibold text-[min(2vh,1.125rem)] tracking-wider ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Mapp
          <span className={isDarkMode ? 'text-indigo-500' : 'text-indigo-600'}>Book</span>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate hexagon points
function calculateHexagonPoints(size: number) {
  const centerX = size;
  const centerY = size;
  let points = [];
  
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI / 3) - (Math.PI / 6); // Start from the top point
    const x = centerX + size * Math.cos(angle);
    const y = centerY + size * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  
  return points.join(' ');
}

export default PageLoadingAnimation;