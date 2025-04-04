'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PollCreator from '@/components/MyPolls/CreatePoll/PollDashboard';
import UserProfile from '@/components/MyPolls/UserProfile';

const MappBookPage = () => {
  const [viewportHeight, setViewportHeight] = useState('100vh');
  // Handle viewport height for mobile browsers
  useEffect(() => {
    // Function to update viewport height
    const updateViewportHeight = () => {
      // Use window.innerHeight for accurate mobile viewport height
      setViewportHeight(`${window.innerHeight}px`);
    };

    // Set initial height
    updateViewportHeight();

    // Update height on resize and orientation change
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  return (
    <div
      className="flex flex-col bg-gray-900"
      style={{ height: viewportHeight }}
    >
      {/* Header */}
      <header className="bg-gray-800 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
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

      <main className="flex-grow w-full flex items-center justify-center overflow-hidden">
        <div className="w-[98%] sm:w-[98%] md:w-[98%] lg:w-[80%] h-[99%] bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 overflow-y-auto">
          <PollCreator />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-center md:justify-between items-center">
            <div className="hidden md:block text-gray-400 text-sm">
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