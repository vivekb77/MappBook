// app/contact/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Map } from 'lucide-react';
import ContactForm from '@/components/contact';

interface FormData {
  name: string;
  email: string;
  query: string;
}

const ContactPage: React.FC = () => {
  const handleSubmit = async (formData: FormData) => {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Logo Section */}
      <div className="p-4 text-center border-b border-pink-100/50 bg-white/50">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
          rounded-xl p-2 shadow-md transform -rotate-3">
            <Map className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
          text-transparent bg-clip-text transform rotate-1">
            MappBook
          </h1>
        </div>
        <p className="text-xs font-medium text-purple-400">
          Share Your World ✨ Track Your Adventures 🌎
        </p>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Contact Us</h1>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <ContactForm onSubmit={handleSubmit} />
        </div>
      </main>
    </div>
  );
};

export default ContactPage;