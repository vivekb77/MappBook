import React, { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import PollStatusBadge from './PollStatusBadge';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PollHeaderProps {
  title: string;
  author: string;
  description: string;
  expiresAt: string;
  isActive?: boolean;
  isExpired?: boolean;
}

const PollHeader: React.FC<PollHeaderProps> = ({ 
  title, 
  author, 
  description, 
  expiresAt,
  isActive = true,
  isExpired = false
}) => {
  const [expanded, setExpanded] = useState(false);
  // Format the expiration time
  const formatExpirationTime = (expiryDate: string) => {
    try {
      const date = new Date(expiryDate);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Unknown';
    }
  };
  
  // Format the expiration date in a readable format
  const formatExpirationDate = (expiryDate: string) => {
    try {
      const date = new Date(expiryDate);
      return format(date, 'PPP p'); // e.g., "April 29th, 2023 at 3:45 PM"
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4">
      {/* Headline - clickable to expand */}
      <div 
        className="flex justify-between items-center cursor-pointer group" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <PollStatusBadge isActive={isActive} isExpired={isExpired} />
        </div>
        <div className="flex items-center gap-2">

          {expanded ? 
            <ChevronUp className="w-5 h-5 transition-transform group-hover:scale-110" /> : 
            <ChevronDown className="w-5 h-5 transition-transform group-hover:scale-110" />
          }
        </div>
      </div>
      
      {/* Expandable content */}
      {expanded && (
        <div className="mt-4 pl-4 border-l-2 border-indigo-500 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Author</h3>
              <p className="text-base font-medium">{author}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Expires on</h3>
              <p className="text-base">{formatExpirationDate(expiresAt)}</p>
            </div>
            
            {description && (
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Description</h3>
                <p className="text-base">{description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PollHeader;