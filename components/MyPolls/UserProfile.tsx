import React, { useState, useRef, useEffect } from 'react';
import { useMappbookUser } from '@/context/UserContext';
import { SignedIn, useClerk, useUser } from '@clerk/nextjs';
import SignInButton from '@/components/MyPolls/SignInButton';
import { logout } from '../utils/auth';
import { track } from '@vercel/analytics';
import { LogOut, User } from 'lucide-react';

interface UserProfileProps {
  isDarkMode: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ isDarkMode }) => {
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
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
        isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-200 text-gray-600'
      }`}>
        <span className="animate-pulse">...</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return <SignInButton redirectUrl="/mypolls" isDarkMode={false} />;
  }

  return (
    <div className="relative">
      {/* Avatar button to open popup */}
      <button 
        onClick={() => setShowPopup(!showPopup)}
        className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden transition-all
          ${isDarkMode
            ? 'bg-slate-800 text-white hover:ring-2 hover:ring-indigo-500'
            : 'bg-gray-100 text-gray-900 hover:ring-2 hover:ring-indigo-400'}
        `}
        aria-label="User profile"
      >
        {user.imageUrl ? (
          <img src={user.imageUrl} alt={user.fullName || 'User'} className="w-full h-full object-cover" />
        ) : (
          <div className={`flex items-center justify-center w-full h-full ${
            isDarkMode 
              ? 'bg-gradient-to-br from-indigo-600 to-purple-700' 
              : 'bg-gradient-to-br from-indigo-500 to-purple-600'
          }`}>
            <span className="text-white font-medium">
              {(mappbookUser?.display_name || user.fullName || 'User')[0].toUpperCase()}
            </span>
          </div>
        )}
      </button>

      {/* User details popup */}
      {showPopup && (
        <div 
          ref={popupRef}
          className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg z-50 overflow-hidden
            ${isDarkMode 
              ? 'bg-slate-900 border border-slate-700 shadow-xl shadow-black/20' 
              : 'bg-white border border-gray-200 shadow-xl shadow-gray-200/50'}
          `}
        >
          <div className={`p-4 ${isDarkMode ? 'border-b border-slate-700' : 'border-b border-gray-100'}`}>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {user.imageUrl ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img src={user.imageUrl} alt={user.fullName || 'User'} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-700' 
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  }`}>
                    <span className="text-white font-medium">
                      {(mappbookUser?.display_name || user.fullName || 'User')[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h3 className={isDarkMode ? 'text-white font-medium' : 'text-gray-900 font-medium'}>
                  {mappbookUser?.display_name || user.fullName || 'User'}
                </h3>
                <p className={isDarkMode ? 'text-gray-400 text-sm' : 'text-gray-500 text-sm'}>
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Poll Credits:</span>
              <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                isDarkMode 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-indigo-500 text-white'
              }`}>
                {mappbookUser?.poll_credits || 0} credits
              </span>
            </div>
          </div>
          
          <div className={`p-3 ${isDarkMode ? 'border-t border-slate-700' : 'border-t border-gray-100'}`}>
            <button
              onClick={handleLogout}
              className={`w-full py-2 px-4 text-sm font-medium rounded-md transition-all flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              <LogOut size={16} className="mr-2" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;