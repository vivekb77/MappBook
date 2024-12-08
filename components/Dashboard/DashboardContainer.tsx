import React, { useContext, useEffect, useState } from 'react';
import { AllUserPlacesContext } from "@/context/AllUserPlacesContext";
import { useMappbookUser } from '@/context/UserContext';
import { SignedIn, useClerk, useUser } from '@clerk/nextjs';
import { logout } from '../utils/auth';
import { Loader2 } from 'lucide-react';
import { track } from '@vercel/analytics';
import DesktopRecommendationBanner from './DesktopRecommendationBanner';
import StatsPopUp from './StatsPopUp';
import AddPlace from './AddPlace';
import ShareSection from './ShareSection';
import BuyPremium from './BuyPremium';

const famousPlaces = [
  {
    place_id: 'sample1',
    mapbox_id: 'sample1',
    place_name: 'Eiffel Tower (Example)',
    place_full_address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
    place_longitude: 2.2945,
    place_latitude: 48.8584,
    place_country: 'France',
    place_country_code: 'FR',
    place_language: 'fr',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'wanttovisit'
  },
  {
    place_id: 'sample2',
    mapbox_id: 'sample2',
    place_name: 'Taj Mahal (Example)',
    place_full_address: 'Agra,Loader2 Uttar Pradesh, India',
    place_longitude: 78.0421,
    place_latitude: 27.1751,
    place_country: 'India',
    place_country_code: 'IN',
    place_language: 'hi',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'visited'
  },
  {
    place_id: 'sample3',
    mapbox_id: 'sample3',
    place_name: 'Machu Picchu (Example)',
    place_full_address: 'Cusco Region, Peru',
    place_longitude: -72.5450,
    place_latitude: -13.1631,
    place_country: 'Peru',
    place_country_code: 'PE',
    place_language: 'es',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'visited'
  },
  {
    place_id: 'sample4',
    mapbox_id: 'sample4',
    place_name: 'Great Wall of China (Example)',
    place_full_address: 'Mutianyu, Huairou District, Beijing, China',
    place_longitude: 116.0169,
    place_latitude: 40.4319,
    place_country: 'China',
    place_country_code: 'CN',
    place_language: 'zh',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'wanttovisit'
  },
  {
    place_id: 'sample5',
    mapbox_id: 'sample5',
    place_name: 'Santorini (Example)',
    place_full_address: 'Thira, South Aegean, Greece',
    place_longitude: 25.4615,
    place_latitude: 36.3932,
    place_country: 'Greece',
    place_country_code: 'GR',
    place_language: 'el',
    place_poi_category: 'island',
    visitedorwanttovisit: 'wanttovisit'
  },
  {
    place_id: 'sample6',
    mapbox_id: 'sample6',
    place_name: 'Petra (Example)',
    place_full_address: 'Ma\'an Governorate, Jordan',
    place_longitude: 35.4444,
    place_latitude: 30.3285,
    place_country: 'Jordan',
    place_country_code: 'JO',
    place_language: 'ar',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'wanttovisit'
  },
  {
    place_id: 'sample7',
    mapbox_id: 'sample7',
    place_name: 'Search and add places',
    place_full_address: 'Search and add places',
    place_longitude: 12.4924,
    place_latitude: 41.8902,
    place_country: 'Italy',
    place_country_code: 'IT',
    place_language: 'it',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'visited'
  },
  {
    place_id: 'sample8',
    mapbox_id: 'sample8',
    place_name: 'Statue of Liberty (Example)',
    place_full_address: 'New York, NY 10004, United States',
    place_longitude: -74.0445,
    place_latitude: 40.6892,
    place_country: 'United States',
    place_country_code: 'US',
    place_language: 'en',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'visited'
  },
  {
    place_id: 'sample9',
    mapbox_id: 'sample9',
    place_name: 'Sydney Opera House (Example)',
    place_full_address: 'Bennelong Point, Sydney NSW 2000, Australia',
    place_longitude: 151.2153,
    place_latitude: -33.8568,
    place_country: 'Australia',
    place_country_code: 'AU',
    place_language: 'en',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'visited'
  },
  {
    place_id: 'sample10',
    mapbox_id: 'sample10',
    place_name: 'Mount Fuji (Example)',
    place_full_address: 'Kitayama, Fujinomiya, Shizuoka 418-0112, Japan',
    place_longitude: 138.7274,
    place_latitude: 35.3606,
    place_country: 'Japan',
    place_country_code: 'JP',
    place_language: 'ja',
    place_poi_category: 'landmark',
    visitedorwanttovisit: 'wanttovisit'
  }
];

const DashboardContainer = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { mappbookUser, setMappbookUser } = useMappbookUser();
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [copyText, setCopyText] = useState('Copy URL to share');
  const [isLoadingSignIn, setIsLoadingSignIn] = useState(false);
  const allUserPlacesContext = useContext(AllUserPlacesContext);
  const [userPlaces, setAllUserPlaces] = allUserPlacesContext
    ? [allUserPlacesContext.userPlaces, allUserPlacesContext.setAllUserPlaces]
    : [[], () => { }];

  useEffect(() => {
    if (isLoaded) {
      setIsLoading(false);
    }
  }, [isLoaded]);

  
  useEffect(() => {
    if (!isSignedIn && userPlaces.length === 0) {
      track('Create Map - New User Visited Create MappBook Page');
      setAllUserPlaces(famousPlaces);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (mappbookUser) {
        setDisplayName(mappbookUser.display_name);
    }
}, [mappbookUser]);

  const handleLogout = async () => {
    const { success, error } = await logout();
    if (!success) {
      track('RED - Create Map - Logout failed');
    }
  };

  
  const handleShareToFriends = async () => {
    try {
      await navigator.clipboard.writeText("https://www.mappbook.com/map/43ff9fc7-43ca-425e-8da6-f5acb2ad529d");
      setCopyText('Copied!');
      setTimeout(() => setCopyText('Copy URL to share'), 2000);
    } catch (err) {
      // console.error('Failed to copy:', err);
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
    <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-xl shadow-lg border border-pink-100/50 backdrop-blur-sm">
      {/* Logo Header */}
      <div className="p-4 text-center border-b border-pink-100/50 bg-white/50">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
          rounded-xl p-2 shadow-md transform -rotate-3">
            {/* <Map className="w-5 h-5 text-white" /> */}
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
          text-transparent bg-clip-text transform rotate-1">
            MappBook
          </h1>
        </div>
        <p className="text-xs font-medium text-purple-400">
          Share your World 🌎 Track your Adventures ✈️
        </p>
      </div>
      {isSignedIn && (<div className="p-4 border-b border-pink-100/50 bg-white/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 
            text-white flex items-center justify-center font-medium shadow-inner">
              {mappbookUser?.display_name?.[0].toUpperCase() || 'MappBook User'?.[0].toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-700">
                {displayName || 'MappBook User'}
              </span>
              <span className="text-xs text-purple-500 font-medium">
                {mappbookUser?.is_premium_user ? 'Premium Travel Creator' : 'Travel Creator'} ✈️
              </span>
            </div>
          </div>
          <StatsPopUp />
        </div>

      </div>
      )}

      <div className="p-6 space-y-6">
        <AddPlace />

        {/* Sign In Call to Action - Show after adding a place when not signed in */}
        {!isSignedIn && (


          <div className="space-y-4">
            <button
              onClick={async () => {
                setIsLoadingSignIn(true);
                try {
                  track('Create Map - New user tried to sign in');
                  await new Promise(resolve => setTimeout(resolve, 300));
                  window.location.href = '/sign-in';
                } catch (error) {
                  track('RED - Create Map - New user sign in has issues');
                  window.location.href = '/sign-in';
                }
              }}
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

        {/* <div className="text-center text-xs font-medium text-purple-400 space-x-2">
          <span>Need help? / Got suggestions? </span>

          <a href="/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-purple-500 transition-colors duration-300"
          >
            Send us a message
          </a>
        </div> */}

        <DesktopRecommendationBanner />
        {/* <div className="text-center text-xs font-medium text-purple-400 space-x-2">
          <span>Love MappBook? Share with your friends! </span>
          <button
            onClick={handleShareToFriends}
            className="text-gray-500 hover:text-purple-500 transition-colors duration-300"
          >
            {copyText}
          </button>
        </div> */}
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

       <ShareSection />
       <BuyPremium/>

        {/* Pro Features Preview */}
        {isSignedIn && (<div className="text-center mt-4">
          <div className="text-xs font-medium text-purple-400 flex items-center justify-center gap-2">
            <span>✨ Add Unlimited Places</span>
            <span>•</span>
            <span>🎨 Share your MappBook</span>
            <span>•</span>
            <span>📊 See Stats</span>
          </div>
        </div>)}



        <div className="mt-8 pt-4 border-t border-pink-100/50">
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
      </div>
    </div >
  );
};

export default DashboardContainer;