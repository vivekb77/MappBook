import React, { useState, useRef, useEffect } from 'react';
import { useMappbookUser } from '@/context/UserContext';
import { SignedIn, useClerk, useUser } from '@clerk/nextjs';
import SignInButton from '@/components/MyPolls/SignInButton';
import { logout } from '../utils/auth';
import { track } from '@vercel/analytics';

const UserProfile = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { mappbookUser } = useMappbookUser();
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Track analytics event
      track('User logged out');
      
      // Close popup
      setShowPopup(false);
      
      // Use your logout function
      const { success, error } = await logout();
      if (!success) {
        track('RED - Logout failed');
        console.error('Logout failed:', error);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white">
        <span className="animate-pulse">...</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return <SignInButton redirectUrl="/mypolls" />;
  }

  return (
    <div className="relative">
      {/* Avatar button to open popup */}
      <button 
        onClick={() => setShowPopup(!showPopup)}
        className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
      >
        {user.imageUrl ? (
          <img src={user.imageUrl} alt={user.fullName || 'User'} className="w-full h-full object-cover" />
        ) : (
          <span>{(mappbookUser?.display_name || user.fullName || 'User')[0].toUpperCase()}</span>
        )}
      </button>

      {/* User details popup */}
      {showPopup && (
        <div 
          ref={popupRef}
          className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg z-50 overflow-hidden border border-gray-700"
        >
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
             
              <div>
                <h3 className="text-white font-medium">{mappbookUser?.display_name || user.fullName || 'User'}</h3>
                <p className="text-gray-400 text-sm">{user.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Poll Credits:</span>
              <span className="text-white font-medium bg-blue-600 px-2 py-1 rounded-full text-xs">
                {mappbookUser?.poll_credits || 0} credits
              </span>
            </div>
          </div>
          
          <div className="p-3 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;