import React from 'react';

interface PollStatusBadgeProps {
  isActive: boolean;
  isExpired: boolean;
}

const PollStatusBadge: React.FC<PollStatusBadgeProps> = ({ isActive, isExpired }) => {
  // Determine the badge color and text
  const getBadgeInfo = () => {
    if (isExpired) {
      return {
        text: 'Expired',
        color: 'bg-red-100 text-red-800 border-red-200'
      };
    } else if (isActive) {
      return {
        text: 'Active',
        color: 'bg-green-100 text-green-800 border-green-200'
      };
    } else {
      return {
        text: 'Inactive',
        color: 'bg-gray-100 text-gray-800 border-gray-200'
      };
    }
  };

  const { text, color } = getBadgeInfo();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {text}
    </span>
  );
};

export default PollStatusBadge;