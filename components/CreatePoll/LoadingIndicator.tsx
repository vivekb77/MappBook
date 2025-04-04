import React from 'react';

const LoadingIndicator = () => {
  // Size will adjust based on container but maintain proportions
  const size = 70;
  const dotSize = 8;
  const hexPoints = calculateHexagonPoints(size);
  
  return (
    <div className="h-screen bg-gray-900 flex items-center justify-center">
      <div className="relative h-[15vh] w-[15vh] min-h-24 min-w-24 max-h-40 max-w-40 flex items-center justify-center">
        {/* Static Hexagon Border */}
        <svg className="absolute" width={size * 2} height={size * 2} viewBox={`0 0 ${size * 2} ${size * 2}`}>
          <polygon 
            points={hexPoints} 
            fill="none" 
            stroke="#4B5563" // gray-600 for subtle border
            strokeWidth="6" 
            className="origin-center"
          />
        </svg>
        
        {/* Inner Hexagon - Subtle fill */}
        <svg className="absolute" width={size * 2} height={size * 2} viewBox={`0 0 ${size * 2} ${size * 2}`}>
          <polygon 
            points={hexPoints} 
            fill="#374151" // gray-700 for subtle inner fill
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
            fill="#3B82F6" // blue-500 for accent color
            className="origin-center drop-shadow-lg"
          />
        </svg>
        
        {/* MappBook logo text */}
        <div className="absolute mt-2 text-gray-300 font-semibold text-[min(2vh,1.125rem)] tracking-wider">
          Mapp
          <span className="text-blue-500">Book</span>
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

export default LoadingIndicator;