//CharacterCounter.tsx
import React from 'react';

interface CharacterCounterProps {
  current: number;
  max: number;
  isDarkMode: boolean;
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({ current, max, isDarkMode }) => {
  const isNearLimit = current >= max * 0.8;
  const isAtLimit = current >= max;
  
  return (
    <div className={`text-xs ${
      isAtLimit ? 'text-red-500' : 
      isNearLimit 
        ? (isDarkMode ? 'text-amber-400' : 'text-amber-600') : 
        (isDarkMode ? 'text-gray-400' : 'text-gray-500')
    }`}>
      {current}/{max}
    </div>
  );
};

export default CharacterCounter;