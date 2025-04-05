'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PollCreator from '@/components/Polls/MyPolls/CreatePoll/PollDashboard';
import UserProfile from '@/components/Polls/MyPolls/UserProfile';
import { Menu, X, HelpCircle, ExternalLink, Moon, Sun } from 'lucide-react';

const MyPollsPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`flex flex-col min-h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Modern Floating Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 ${isDarkMode ? 'bg-slate-950/80' : 'bg-white/80'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo with subtle animation */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
              <div className={`relative px-5 py-2 rounded-lg ${isDarkMode ? 'bg-slate-900' : 'bg-white'} flex items-center`}>
                <h1 className="text-2xl font-bold">
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Mapp</span>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Book</span>
                </h1>
              </div>
            </div>

            {/* Controls - visible on all devices */}
            <div className="flex items-center space-x-4">
              {/* Dark mode toggle */}
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              {/* User profile - always visible */}
              <UserProfile isDarkMode={isDarkMode} />
            </div>
          </div>
        </div>
      </header>


      {/* Main Content with extra top padding for fixed header */}
      <main className="flex-grow w-full px-4 py-24 sm:px-6 lg:px-8">
        <div className={`max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-xl transition-all ${isDarkMode ? 'bg-slate-900 shadow-indigo-500/10' : 'bg-white shadow-gray-200/50'}`}>
          <div className="h-full flex flex-col">
            {/* Card Header */}
            <div className={`px-6 py-5 flex justify-between items-center border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
              <h2 className="text-xl font-semibold">Dashboard</h2>
              
              {/* Help button styled as a pill */}
              <a
                href="https://mappbook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center px-4 py-1.5 text-sm rounded-full transition-all ${
                  isDarkMode 
                    ? 'bg-slate-800 text-gray-300 hover:bg-indigo-600 hover:text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
                }`}
              >
                <HelpCircle size={16} className="mr-1.5" />
                Need help?
                <ExternalLink size={14} className="ml-1.5" />
              </a>
            </div>

            {/* Poll Creator Component */}
            <div className="flex-grow p-6">
            <PollCreator isDarkMode={isDarkMode} />
            </div>
          </div>
        </div>
      </main>

      {/* Modern subtle footer */}
      <footer className={`py-8 mt-auto ${isDarkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  © 2025 MappBook. All rights reserved.
                </span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              <Link href="/privacy" className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>
                Privacy
              </Link>
              <Link href="/terms" className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>
                Terms
              </Link>
              <Link href="/contact" className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MyPollsPage;