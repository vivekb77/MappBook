'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PollCreator from '@/components/CreatePoll/Questions/PollDashboard';
import { useMappbookUser } from '@/context/UserContext';
import { SignedIn, useClerk, useUser } from '@clerk/nextjs';
import UserProfile from '@/components/CreatePoll/UserProfile';

const MappBookPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-100">MappBook</h1>
              <p className="text-sm text-gray-400">Polls for you</p>
            </div>


            <div className="flex items-center">
              <UserProfile />
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 min-h-[500px]">
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