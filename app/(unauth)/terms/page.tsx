'use client';

import { FC } from 'react';
import Link from 'next/link';

const TermsPage: FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-100">Terms and Conditions</h1>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-100 mb-4">Terms and Conditions of Use - MappBook</h2>
            <p className="text-gray-400">Last updated: December 28, 2024</p>
          </section>

          {/* MappBook Specific Terms */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-100 mb-4">MappBook Services and Usage</h3>
            <div className="space-y-4 text-gray-300">
              <p>
                MappBook provides a web-based platform for creating aerial-style map visualizations and animations. By using our services, you agree to the following specific terms:
              </p>
              <div>
                <p className="mb-2">Map Content Usage:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Users may create and export map animations for personal and commercial use</li>
                  <li>Map data and imagery are subject to third-party terms and conditions</li>
                  <li>Users must not scrape, download, or store map data beyond the platform's intended use</li>
                  <li>Generated content must comply with applicable copyright and intellectual property laws</li>
                </ul>
              </div>
              <div>
                <p className="mb-2">Usage Limitations:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Fair usage policies apply to video rendering and export functions</li>
                  <li>Account sharing is prohibited</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-100 mb-4">Limitation of Liability</h3>
            <div className="space-y-4 text-gray-300">
              <p>
                The User acknowledges having read and accepted these conditions, as well as having the necessary skills to navigate the web application.
              </p>
              <p>
                The User is solely responsible for any Content they post or share through the Services, including but not limited to text, images, opinions, and comments. The User must ensure that such content does not infringe upon the rights of any third parties. The User agrees to indemnify MappBook against any claims, directly or indirectly related to their content or comments, that may be brought against MappBook by any party. This includes covering any resulting costs, including legal fees and court expenses.
              </p>
              <div>
                <p className="mb-2">MappBook reserves the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Remove any User Content, in whole or in part, at any time and for any reason without prior notice or justification</li>
                  <li>Suspend or terminate a User's access if their behavior on the platform is deemed inappropriate</li>
                  <li>Access, read, preserve, or disclose any information necessary to:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Comply with applicable laws, regulations, legal processes, or governmental requests</li>
                      <li>Enforce these Terms</li>
                      <li>Investigate potential violations</li>
                      <li>Detect, prevent, or address fraud, security, or technical issues</li>
                      <li>Respond to user support requests</li>
                      <li>Protect the rights, property, or safety of MappBook, its Users, and the public</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Service Limitations */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-100 mb-4">Service Limitations</h3>
            <div className="space-y-4 text-gray-300">
              <p>
                While MappBook strives to provide accurate and reliable information, we cannot guarantee the complete accuracy or relevance of data presented through the Services. All information provided through the platform is for informational purposes only and should not be construed as professional advice.
              </p>
              <div>
                <p className="mb-2">MappBook shall not be held responsible for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Disputes between Users</li>
                  <li>The accuracy of third-party content</li>
                  <li>Any changes to information between the time of download and access</li>
                  <li>The proper use of information available on the platform</li>
                </ul>
              </div>
              <p>
                The User acknowledges the inherent limitations and constraints of the Internet, particularly regarding data security. MappBook cannot guarantee absolute security of data exchanges and shall not be held liable for any loss or damage arising from the transmission of information, including login credentials.
              </p>
            </div>
          </section>

          {/* Personal Data and Privacy */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-100 mb-4">Personal Data and Privacy</h3>
            <div className="space-y-4 text-gray-300">
              <div>
                <p className="mb-2">Personal data collected through MappBook is processed with User consent and is intended to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Improve user experience</li>
                  <li>Enhance service functionality</li>
                  <li>Conduct statistical analysis</li>
                  <li>Personalize services</li>
                </ul>
              </div>
              <div>
                <p className="mb-2">MappBook may:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Collect both personally identifiable and non-identifiable data through cookies and similar technologies</li>
                  <li>Share anonymized user information for analytical purposes, subject to prior user agreement</li>
                  <li>Display targeted advertising and offers, which may change in type and extent</li>
                </ul>
              </div>
              <div>
                <p className="mb-2">Users have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access their personal data</li>
                  <li>Request corrections to their data</li>
                  <li>Request deletion of their data</li>
                  <li>Object to data processing for commercial purposes</li>
                </ul>
              </div>
              <p>
                To exercise these rights, contact MappBook at:{' '}
                <a href="mailto:contact@mappbook.com" className="text-blue-500 hover:text-blue-400">
                  contact@mappbook.com
                </a>
              </p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-100 mb-4">Intellectual Property</h3>
            <div className="space-y-4 text-gray-300">
              <p>
                The web application, including its structure, design, text, graphics, images, and other content, is protected by intellectual property laws. Any reproduction, distribution, or use of the platform's content without prior written authorization from MappBook is strictly prohibited.
              </p>
              <p>
                User-generated content remains the intellectual property of its creators, subject to a non-exclusive license granted to MappBook for service-related purposes.
              </p>
              <div>
                <p className="mb-2">External websites linking to MappBook must:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Obtain prior written permission</li>
                  <li>Remove links upon request</li>
                  <li>Avoid techniques such as framing or inline linking</li>
                </ul>
              </div>
            </div>
          </section>

          {/* External Links */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-100 mb-4">External Links</h3>
            <div className="space-y-4 text-gray-300">
              <p>
                MappBook may provide links to third-party websites. As we have no control over external resources, MappBook assumes no responsibility for their availability or content.
              </p>
            </div>
          </section>

          {/* Governing Law */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-100 mb-4">Governing Law and Jurisdiction</h3>
            <div className="space-y-4 text-gray-300">
              <p>
                These Terms are governed by and construed in accordance with applicable laws. Any disputes that cannot be resolved amicably shall be subject to the exclusive jurisdiction of the appropriate courts.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="border-t border-gray-700 pt-8">
            <p className="text-gray-300">
              For questions regarding these Terms, please contact:{' '}
              <a href="mailto:contact@mappbook.com" className="text-blue-500 hover:text-blue-400">
                contact@mappbook.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;