// components/SuccessNotification.tsx
import React, { useEffect, useState } from 'react';
import { FiCheckCircle } from 'react-icons/fi';

interface SuccessNotificationProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  message,
  isVisible,
  onClose,
  duration = 3000,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          setIsClosing(false);
          onClose();
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  return (
    <div className={`notification-container ${isClosing ? 'fade-out' : 'fade-in'}`}>
      <div className="success-notification">
        <FiCheckCircle className="success-icon" />
        <p className="success-message">{message}</p>
      </div>
      <style jsx>{`
        .notification-container {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2000;
          transition: opacity 0.3s ease-in-out;
        }
        
        .fade-in {
          opacity: 1;
        }
        
        .fade-out {
          opacity: 0;
        }
        
        .success-notification {
          display: flex;
          align-items: center;
          background-color: #4BB543;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          min-width: 280px;
          max-width: 400px;
        }
        
        .success-icon {
          font-size: 22px;
          margin-right: 12px;
        }
        
        .success-message {
          font-size: 16px;
          font-weight: 500;
          margin: 0;
        }
        
        @media (max-width: 480px) {
          .success-notification {
            min-width: 240px;
            padding: 10px 16px;
          }
          
          .success-icon {
            font-size: 18px;
          }
          
          .success-message {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default SuccessNotification;