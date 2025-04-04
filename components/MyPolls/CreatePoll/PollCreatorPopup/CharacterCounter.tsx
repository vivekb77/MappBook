//CharacterCounter.tsx
import React from 'react';

interface CharacterCounterProps {
  current: number;
  max: number;
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({ current, max }) => {
  const isNearLimit = current >= max * 0.8;
  const isAtLimit = current >= max;
  
  return (
    <div className={`text-xs ${
      isAtLimit ? 'text-red-500' : 
      isNearLimit ? 'text-yellow-500' : 
      'text-gray-400'
    }`}>
      {current}/{max}
    </div>
  );
};

export default CharacterCounter;