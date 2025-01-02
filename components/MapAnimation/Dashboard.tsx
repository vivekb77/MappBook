import React, { useEffect, useState } from 'react';
import { useMappbookUser } from '@/context/UserContext';
import { useUser } from '@clerk/nextjs';
import { logout } from '../utils/auth';
import { Camera, Globe, Video, Coins } from 'lucide-react';
import SignInButton from './SignInButton';
import { track } from '@vercel/analytics';
import AddCredits from './AddCredits';
import FootageHistory from './FootageHistory';
import DesktopRecommendationBanner from './DesktopRecommendationBanner';

declare global {
  interface Window {
    rdt: any;
  }
}

const DashboardContainer = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { mappbookUser, setMappbookUser } = useMappbookUser();
  const [isLoading, setIsLoading] = useState(true);

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


  if (isLoading || !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
  }

  const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
    return (
      <div className="bg-gray-800 p-6 rounded-xl w-full">
        <div className="mb-4 flex items-center gap-3">
          {icon}
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        <p className="text-gray-300">{description}</p>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black min-h-screen flex flex-col">
      <div className="flex-1">
        {isSignedIn && mappbookUser && (
          <div className="p-4 border-b border-gray-800 bg-gray-900">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">
                  {mappbookUser.display_name || 'MappBook User'}
                </span>
                <span className="text-xs text-gray-400">Dashboard</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-full border border-gray-700">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-200">
                    {mappbookUser.drone_footage_credits || 0} credits
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500 
                text-white flex items-center justify-center font-medium">
                  {mappbookUser.display_name?.[0].toUpperCase() || 'M'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {isLoaded && !isSignedIn &&(
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Welcome to MappBook</h2>
                <p className="text-gray-300 mb-6">Create stunning drone-like footage using maps. Sign in to start your journey.</p>
                <SignInButton />
              </div>

              <div className="flex flex-col gap-4 mt-8">
                <FeatureCard
                  icon={<Globe className="w-8 h-8 text-blue-500" />}
                  title="Global Coverage"
                  description="Access detailed maps from anywhere in the world to create your perfect shot."
                />
                <FeatureCard
                  icon={<Camera className="w-8 h-8 text-blue-500" />}
                  title="Cinematic Paths"
                  description="Design smooth camera movements and transitions for professional-looking results."
                />
                <FeatureCard
                  icon={<Video className="w-8 h-8 text-blue-500" />}
                  title="Easy Export"
                  description="Export your creations in high quality video formats ready to share."
                />
              </div>
            </div>
          )}

          {isLoaded && isSignedIn && mappbookUser && (
            <>
              <div>
                {/* <h2 className="text-2xl font-bold text-white mb-4">No drone required 😉</h2> */}
                <p className="text-gray-300 mb-6">Create amazing drone-like footage with MappBook</p>
                <div className="w-full overflow-x-auto">
                  <FootageHistory userId={mappbookUser.mappbook_user_id} />
                </div>
              </div>
              <AddCredits />
            </>
          )}
        </div>
        <DesktopRecommendationBanner />
      </div>

      <div className="border-t border-gray-800 bg-gray-900 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-4 text-sm">
            <a
              href="/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-500 transition-colors duration-300"
            >
              Contact
            </a>
            <span className="text-gray-700">•</span>
            {isSignedIn ? (
              <button onClick={handleLogout} className="text-gray-400 hover:text-blue-500 transition-colors duration-300">
                Logout
              </button>
            ) : (
              <a href="/sign-in" className="text-gray-400 hover:text-blue-500 transition-colors duration-300">
                Sign In
              </a>
            )}
            <span className="text-gray-700">•</span>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-500 transition-colors duration-300"
            >
              Terms
            </a>
            <span className="text-gray-700">•</span>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-500 transition-colors duration-300"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContainer;