import React, { useEffect } from 'react';
import { FiCheckCircle } from 'react-icons/fi';

interface ToastMessageProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const ToastMessage: React.FC<ToastMessageProps> = ({
  message,
  isVisible,
  onClose,
  duration = 2000
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50 animate-fade-in">
      <div className="bg-green-100 border-l-4 border-green-500 rounded-lg shadow-md p-4 flex items-center">
        <FiCheckCircle className="text-green-600 text-xl md:text-2xl mr-3 flex-shrink-0" />
        <div className="text-green-800 text-sm md:text-base font-medium">{message}</div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
export default ToastMessage;