import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Users } from 'lucide-react';

interface FancyFanCounterProps {
  initialCount: number;
}

const FancyFanCounter: React.FC<FancyFanCounterProps> = ({ initialCount = 0 }) => {
  const [fanCount, setFanCount] = useState(initialCount);
  const [isIncrementing, setIsIncrementing] = useState(false);
  const [lastIncrement, setLastIncrement] = useState(0);
  const countRef = useRef<HTMLSpanElement | null>(null);
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };
  
  const incrementCounter = useCallback(() => {
    // Random increment between 1 and 10
    const randomIncrement = Math.floor(Math.random() * 10) + 1;
    setLastIncrement(randomIncrement);
    
    // Start animation
    setIsIncrementing(true);
    setTimeout(() => setIsIncrementing(false), 800);
    
    // Update counter
    setFanCount(prevCount => prevCount + randomIncrement);
    
    // Set next interval between 1 and 10 seconds
    const nextInterval = (Math.floor(Math.random() * 10) + 1) * 1000;
    setTimeout(incrementCounter, nextInterval);
  }, []);
  
  useEffect(() => {
    // Start the incrementation process
    const firstInterval = (Math.floor(Math.random() * 5) + 1) * 1000;
    const timer = setTimeout(incrementCounter, firstInterval);
    
    // Clean up on unmount
    return () => clearTimeout(timer);
  }, [incrementCounter]);
  
  // Add pulse animation when counter updates
  useEffect(() => {
    if (countRef.current && isIncrementing) {
      const element = countRef.current as HTMLElement;
      element.classList.add('pulse');
      setTimeout(() => {
        if (countRef.current) {
          const element = countRef.current as HTMLElement;
          element.classList.remove('pulse');
        }
      }, 700);
    }
  }, [isIncrementing]);
  
  return (
    <div className="flex items-center">
      <div className="relative bg-white rounded-xl shadow-md px-3 py-2 overflow-hidden border border-green-100" style={{ width: '170px' }}>
        {/* Background glow effect */}
        <div className={`absolute inset-0 bg-green-50 opacity-50 ${isIncrementing ? 'animate-ping' : ''}`}></div>
        
        {/* Counter */}
        <div className="flex items-center relative z-10">
          <Users size={18} className="text-green-700 mr-2 flex-shrink-0" />
          <div className="w-full text-left">
            <span 
              ref={countRef}
              className={`font-bold text-xl text-green-700 transition-all duration-300 ${isIncrementing ? 'scale-110 origin-left' : 'scale-100'} inline-block`}
            >
              {formatNumber(fanCount)}
            </span>
          </div>
          
          {/* Show increment */}
          {isIncrementing && (
            <div className="ml-2 flex items-center">
              <span className="text-green-600 text-sm font-semibold animate-fade-up">
                +{lastIncrement}
              </span>
              <svg className="w-4 h-4 text-green-500 ml-1 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className={`absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-green-300 via-green-500 to-green-700 ${isIncrementing ? 'opacity-100' : 'opacity-40'}`}></div>
      </div>
      
      {/* Additional CSS for custom animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .pulse {
          animation: pulse 0.7s ease-in-out;
        }
        @keyframes fade-up {
          0% { opacity: 0; transform: translateY(10px); }
          50% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .animate-fade-up {
          animation: fade-up 1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default FancyFanCounter;