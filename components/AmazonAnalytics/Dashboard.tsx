import React, { useEffect, useState } from 'react';
import { useMappbookUser } from '@/context/UserContext';
import { useUser } from '@clerk/nextjs';
import { logout } from '../utils/auth';
import { Camera, Globe, Video, Coins, Instagram, ChevronUp, ChevronDown } from 'lucide-react';
import SignInButton from './SignInButton';
import { track } from '@vercel/analytics';
import AddCredits from './BuyPremium';
import OrderReportHistory from './OrderReportHistory';
import DesktopRecommendationBanner from './DesktopRecommendationBanner';
import FileUpload from './FileUpload';
import InfoPopUp from "./InfoPopUp";

declare global {
  interface Window {
    rdt: any;
  }
}

const DashboardContainer = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { mappbookUser, setMappbookUser } = useMappbookUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setIsLoading(false);
    }
  }, [isLoaded]);

  const handleLogout = async () => {
    const { success, error } = await logout();
    if (!success) {
      track('RED - Amazon - Logout failed');
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
    // description: string;
  }

  const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title }) => {
    return (
      <div className="bg-gray-800 p-6 rounded-xl w-full">
        <div className="mb-4 flex items-center gap-3">
          {icon}
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        {/* <p className="text-gray-300">{description}</p> */}
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
                {/* <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-full border border-gray-700">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-200">
                    {mappbookUser.drone_footage_credits || 0} credits
                  </span>
                </div> */}
                <div className="w-10 h-10 rounded-full bg-blue-500 
                text-white flex items-center justify-center font-medium">
                  {mappbookUser.display_name?.[0].toUpperCase() || 'M'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {isLoaded && !isSignedIn && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                {/* <h2 className="text-3xl font-bold text-white mb-4">Welcome to MappBook</h2> */}
                <p className="text-gray-300 mb-6">Location Analytics for Amazon Sellers</p>

                <SignInButton />

                <p className="text-gray-300 mt-8 mb-6">Do you ever struggle to pin down an understanding of where your customers are?</p>
              </div>

              <div className="flex flex-col gap-4 mt-8">
                <FeatureCard
                  icon={<Globe className="w-8 h-8 text-blue-500" />}
                  title="Customer Geographic Distribution"
                />
                <FeatureCard
                  icon={<Globe className="w-8 h-8 text-blue-500" />}
                  title="Regional Revenue Performance"
                />
                <FeatureCard
                  icon={<Globe className="w-8 h-8 text-blue-500" />}
                  title="Regional Product Performance Map"
                />
                <FeatureCard
                  icon={<Globe className="w-8 h-8 text-blue-500" />}
                  title="Geographic Return Rate Analysis"
                />
                <FeatureCard
                  icon={<Globe className="w-8 h-8 text-blue-500" />}
                  title="Channel Success by Location"
                />
              </div>

              <div className="w-full overflow-x-auto">
                <OrderReportHistory userId={'10dbcf84-003f-44a3-8402-8939f3bb951c'} />
              </div>

            </div>
          )}

          {isLoaded && isSignedIn && mappbookUser && (
            <>
              {/* <InfoPopUp /> */}
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                  {/* <h2 className="text-3xl font-bold text-white">Geotargeting Analytics</h2> */}
                  <p className="text-gray-300">Location Intelligence for Amazon Sellers</p>
                  {/* <p className="text-gray-300">Understand and visualise exactly where your audience is located</p> */}
                </div>

                <div className="space-y-6">
                  <button
                    onClick={() => setIsVisible(!isVisible)}
                    className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                  >
                    <span>How to download Amazon Seller Central Order Reports</span>
                    {isVisible ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>

                  {isVisible && (
                    <div className="bg-gray-800 p-8 rounded-lg">
                      <ol className="list-disc pl-6 text-gray-300 space-y-3">
                        <li>Login: First, sellers must log into their Amazon Seller Central account.</li>
                        <li>Navigate to Reports: Usually found in the main navigation bar, this section contains various sales, inventory, and performance reports.</li>
                        <li>Locate the 'All Orders Report': Within the Reports section, sellers can find and select the specific "All Orders Report".</li>
                        <li>Select Date Range (max 28 days): Amazon allows sellers to pull reports based on specific dates. Choose last 28 days.</li>
                        <li>Download: Once the report has been generated, there will typically be an option to download it. The report is often available in different formats .csv or .txt.</li>
                        <li>Upload the CSV file below</li>
                        <li>Note: 'ship-postal-code' should be available in order data, though Amazon may limit access to complete address information after 28 days.</li>
                        <li>Need help - Send us a message by clicking contact button at the bottom of page.</li>
                      </ol>
                    </div>
                  )}
                </div>
                <DesktopRecommendationBanner />
                <div className="space-y-6">
                  <FileUpload />
                  <div className="w-full overflow-x-auto">
                    <OrderReportHistory userId={mappbookUser.mappbook_user_id} />
                  </div>
                </div>
              </div>
            </>
          )}


        </div>

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