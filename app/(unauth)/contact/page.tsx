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
   <div className="min-h-screen bg-gray-900">
     {/* Logo Section */}
     <div className="absolute left-1/2 top-1 -translate-x-1/2 z-50">
       <div className="bg-gray-800/90 p-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors border border-gray-700">
         <span className="font-bold text-xl text-blue-500">MappBook</span>
       </div>
     </div>

     {/* Header */}
     <header className="bg-gray-800 shadow-sm">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
         <div className="flex justify-end items-center">
           <Link
             href="/"
             className="text-blue-500 hover:text-blue-400 font-medium"
           >
             Back to Home
           </Link>
         </div>
       </div>
     </header>

     {/* Main Content */}
     <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
       <h1 className="text-2xl font-bold text-gray-100 mb-6">Contact Us</h1>
       <div className="bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8">
         <ContactForm onSubmit={handleSubmit} />
       </div>
     </main>
   </div>
 );
};

export default ContactPage;