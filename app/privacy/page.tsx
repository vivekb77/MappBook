// src/app/privacy/page.tsx
'use client';

import { FC } from 'react';
import Link from 'next/link';

const PrivacyPolicyPage: FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy - MappBook</h2>
            <p className="text-gray-600">Last updated: October 30, 2024</p>
          </section>

          {/* Overview */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                Your privacy is important to us. This Privacy Policy explains how MappBook ("we", "our", or "us") collects, uses, shares, and protects your personal information when you use our web application and services.
              </p>
              <p>
                By using MappBook, you agree to the collection and use of information in accordance with this policy.
              </p>
            </div>
          </section>

          {/* Information We Collect */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h3>
            <div className="space-y-4 text-gray-700">
              <div>
                <p className="mb-2">We collect several types of information, including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Personal Information:</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Name and email address</li>
                      <li>Profile information you provide</li>
                      <li>Location data when you use our mapping features</li>
                      <li>User-generated content and preferences</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Usage Information:</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Device and browser information</li>
                      <li>Pages viewed and features used</li>
                      <li>Interaction with our services</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Location Information:</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Places you save or share</li>
                      <li>Search history for locations</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h3>
            <div className="space-y-4 text-gray-700">
              <p>We use the collected information for various purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide and maintain our Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information to improve our Service</li>
                <li>To monitor the usage of our Service</li>
                <li>To detect, prevent and address technical issues</li>
                <li>To personalize your experience</li>
                <li>To provide location-based services</li>
              </ul>
            </div>
          </section>

          {/* Data Sharing and Disclosure */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Data Sharing and Disclosure</h3>
            <div className="space-y-4 text-gray-700">
              <p>We may share your personal information in the following situations:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>With Service Providers:</strong> To monitor and analyze the use of our service, for payment processing, or to contact you.
                </li>
                <li>
                  <strong>For Business Transfers:</strong> In connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition.
                </li>
                <li>
                  <strong>With Your Consent:</strong> We may disclose your personal information for any other purpose with your consent.
                </li>
                <li>
                  <strong>Legal Requirements:</strong> To comply with legal obligations or respond to legal requests.
                </li>
              </ul>
            </div>
          </section>

          {/* Data Security */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                The security of your data is important to us. We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure.
              </p>
              <p>
                We strive to use commercially acceptable means to protect your Personal Information, but we cannot guarantee its absolute security.
              </p>
            </div>
          </section>

          {/* Your Data Rights */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Your Data Rights</h3>
            <div className="space-y-4 text-gray-700">
              <p>You have certain rights regarding your personal information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct any inaccurate information</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Request data portability</li>
                <li>Withdraw consent where applicable</li>
              </ul>
              <p>
                To exercise these rights, please contact us at:{' '}
                <a href="mailto:newsexpressnz@gmail.com" className="text-blue-600 hover:text-blue-800">
                    newsexpressnz@gmail.com
                </a>
              </p>
            </div>
          </section>

          {/* Changes to Privacy Policy */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Privacy Policy</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
              <p>
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="border-t pt-8">
            <p className="text-gray-700">
              If you have any questions about this Privacy Policy, please contact us at:{' '}
              <a href="mailto:newsexpressnz@gmail.com" className="text-blue-600 hover:text-blue-800">
                newsexpressnz@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;