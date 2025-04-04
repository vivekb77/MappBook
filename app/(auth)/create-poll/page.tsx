'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PollCreator from '@/components/CreatePoll/Questions/PollDashboard';
import { useMappbookUser } from '@/context/UserContext';
import { SignedIn, useClerk, useUser } from '@clerk/nextjs';
import UserProfile from '@/components/CreatePoll/UserProfile';
import LoadingIndicator from '@/components/CreatePoll/LoadingIndicator';

const MappBookPage = () => {
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Simulate loading - in a real app, you'd check for actual data loading states
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return <LoadingIndicator />;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <div className="flex items-center">
                <div className="bg-gray-800 px-3 py-1.5 rounded-lg shadow-md">
                  <h1 className="text-2xl font-bold tracking-wide">
                    <span className="text-gray-100">Mapp</span>
                    <span className="text-blue-500">Book</span>
                  </h1>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full px-2 sm:px-3 md:px-4 py-6">
        <div className="w-[95%] sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 min-h-[500px]">
          <PollCreator />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-center md:justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 MappBook. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-gray-300 text-sm">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-gray-300 text-sm">
                Terms
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-gray-300 text-sm">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MappBookPage;