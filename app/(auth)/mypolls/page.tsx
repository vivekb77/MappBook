'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PollCreator from '@/components/MyPolls/CreatePoll/PollDashboard';
import UserProfile from '@/components/MyPolls/UserProfile';

const MyPollsage = () => {

  return (
    <div className="flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 h-screen-dynamic">
      {/* Header */}
      <header className="bg-gray-800 backdrop-filter backdrop-blur-lg bg-opacity-80 shadow-lg flex-shrink-0 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-2 rounded-lg shadow-lg border border-gray-700">
                  <h1 className="text-2xl font-bold tracking-wider">
                    <span className="text-gray-100">Mapp</span>
                    <span className="text-blue-400 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Book</span>
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
      <main className="flex-grow w-full flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-7xl h-full bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Content Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4 border-b border-gray-700">
              {/* <h2 className="text-xl font-semibold text-white">Create Your Poll</h2> */}
              <p className="text-gray-400 text-sm mt-1">
                Need help?
                <a
                  href="https://mappbook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-400 hover:text-blue-300 transition-colors duration-200 inline-flex items-center"
                >
                  Learn
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </p>
            </div>

            {/* Poll Creator Component */}
            <div className="flex-grow overflow-y-auto p-5">
              <PollCreator />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 bg-opacity-90 backdrop-filter backdrop-blur-sm py-4 shadow-inner border-t border-gray-700 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-center md:justify-between items-center">
            <div className="hidden md:block text-gray-400 text-sm font-medium">
              © 2025 MappBook. All rights reserved.
            </div>
            <div className="flex space-x-8">
              <Link href="/privacy" className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm">
                Terms
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MyPollsage;