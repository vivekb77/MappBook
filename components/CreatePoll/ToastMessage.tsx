import React, { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface ToastMessageProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'error';
}

export const ToastMessage: React.FC<ToastMessageProps> = ({
  message,
  isVisible,
  onClose,
  duration = 2000,
  type = 'success'
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
  
  // Define styles based on type
  const styles = {
    success: {
      bgColor: 'bg-green-100',
      borderColor: 'border-green-500',
      textColor: 'text-green-800',
      iconColor: 'text-green-600'
    },
    error: {
      bgColor: 'bg-red-100',
      borderColor: 'border-red-500',
      textColor: 'text-red-800',
      iconColor: 'text-red-600'
    }
  };
  
  const currentStyle = styles[type];
  const Icon = type === 'success' ? FiCheckCircle : FiAlertCircle;
  
  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50 animate-fade-in">
      <div className={`${currentStyle.bgColor} border-l-4 ${currentStyle.borderColor} rounded-lg shadow-md p-4 flex items-center`}>
        <Icon className={`${currentStyle.iconColor} text-xl md:text-2xl mr-3 flex-shrink-0`} />
        <div className={`${currentStyle.textColor} text-sm md:text-base font-medium`}>{message}</div>
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