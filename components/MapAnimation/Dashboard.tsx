import React, { useContext, useEffect, useState } from 'react';
import { useMappbookUser } from '@/context/UserContext';
import { SignedIn, useClerk, useUser } from '@clerk/nextjs';
import { logout } from '../utils/auth';
import { Loader2, Sparkles } from 'lucide-react';
import { track } from '@vercel/analytics';
import AddCredits from './AddCredits';
import VideoHistory from './VideoHistory';



declare global {
  interface Window {
    rdt: any;
  }
}

const DashboardContainer = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { mappbookUser, setMappbookUser } = useMappbookUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSignIn, setIsLoadingSignIn] = useState(false);


  useEffect(() => {
    if (isLoaded) {
      setIsLoading(false);
    }
  }, [isLoaded]);


  const handleLogout = async () => {
    const { success, error } = await logout();
    if (!success) {
      track('RED - Animation - Logout failed');
    }
  };


  const handleSignIn = async () => {
    setIsLoadingSignIn(true);
    try {
      track('Animation - New user tried to sign in');

      // Track Reddit conversion - ensure rdt is properly accessed
      if (typeof window !== 'undefined') {
        // Ensure we're calling the global rdt function correctly
        window.rdt?.('track', 'SignUp', {});
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      window.location.href = '/sign-in';
    } catch (error) {
      track('RED - Animation - New user sign in has issues');
      window.location.href = '/sign-in';
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-xl shadow-lg border border-pink-100/50 backdrop-blur-sm min-h-screen h-full flex flex-col">
      {/* Logo Header */}
      <div className="flex-1">

        {isSignedIn && mappbookUser && (<div className="p-4 border-b border-pink-100/50 bg-white/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 
            text-white flex items-center justify-center font-medium shadow-inner">
                {mappbookUser.display_name?.[0].toUpperCase() || 'MappBook User'?.[0].toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-700">
                  {mappbookUser.display_name || 'MappBook User'}
                </span>
              </div>
            </div>

          </div>

        </div>
        )}

        <div className="p-6 space-y-6">


          {/* Sign In Call to Action - Show after adding a place when not signed in */}
          {!isSignedIn && (


            <div className="space-y-4">
              <button
                onClick={handleSignIn}
                disabled={isLoadingSignIn}
                className="w-full h-12 px-4 rounded-md
      bg-white text-gray-700 font-roboto font-medium
      border border-gray-200 
      hover:bg-gray-50 hover:shadow-md
      transform transition-all duration-300
      flex items-center justify-center gap-3
      disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoadingSignIn ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>

            </div>
          )}
        </div>

        {/* New Bottom Section with Divider */}
        <div className="px-6 pb-6">
          {/* Decorative Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-pink-200/50"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 px-4">
                {/* <Sparkles className="w-5 h-5 text-purple-400" /> */}
              </span>
            </div>
          </div>


          <div className="w-full">
            {mappbookUser && (
              <VideoHistory
                userId={mappbookUser.mappbook_user_id}
              />
            )}
            <AddCredits />
          </div>



        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-pink-100/50 px-6 pb-6">
        <div className="flex items-center justify-center gap-4 text-xs">
          <a
            href="/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-purple-500 transition-colors duration-300"
          >
            Contact
          </a>
          <span className="text-gray-300">•</span>
          {isSignedIn ? (
            <button onClick={handleLogout} className="text-gray-500 hover:text-purple-500 transition-colors duration-300">
              Logout
            </button>
          ) : (
            <a href="/sign-in" className="text-gray-500 hover:text-purple-500 transition-colors duration-300">
              Sign In
            </a>
          )}
          <span className="text-gray-300">•</span>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-purple-500 transition-colors duration-300"
          >
            Terms
          </a>
          <span className="text-gray-300">•</span>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-purple-500 transition-colors duration-300"
          >
            Privacy
          </a>
        </div>
      </div>
    </div >
  );
};

export default DashboardContainer;