"use client"
import React from 'react';
import { BarChart, Zap, Target, Pin, Globe } from 'lucide-react';
import Link from 'next/link';
import { track } from '@vercel/analytics';
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

track('Amazon Analytics - Landing page viewed');
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="bg-gray-800 p-6 rounded-xl text-center hover:transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
    <div className="mb-4 flex justify-center">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <header className="absolute top-4 left-4 z-50">
        <div className="bg-gray-800/90 p-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors border border-gray-700">
          <span className="font-bold text-xl text-blue-400">MappBook</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
            {/* <span className="text-yellow-400 font-semibold">Trusted by 5,000+ Amazon Sellers</span> */}
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Transform Your Amazon Business with<br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Intelligent Geotargeting
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Unlock hidden revenue opportunities with location-based analytics, customer mapping, and regional strategy optimization for Amazon FBA and FBM sellers.
          </p>
          <Link href="/amazonanalytics">
            <button className="px-8 py-4 bg-blue-500 rounded-lg text-lg font-semibold hover:bg-blue-600 transition transform hover:scale-105">
              Start Analyzing Free Trial →
            </button>
          </Link>
          <p className="mt-4 text-sm text-gray-400">No credit card required</p>
        </div>
      </section>

      {/* Animated Visual Section */}


      {/* GIF Section */}
      <section className="container mx-auto px-4 py-7">
        <div className="relative rounded-xl overflow-hidden bg-gray-800">
          <img
            src="/drone/amazonlandingpage.png"
            alt="Analytics Visualization"
            className="w-full h-auto object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent">
            <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
              <p className="text-gray-300">Watch Your Data Come to Life</p>
            </div>
          </div>
        </div>
      </section>

      {/* New Use Cases Section */}
      <section className="container mx-auto px-4 py-7">
        <div className="bg-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6">Powerful Use Cases</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-6 h-6 text-blue-400" />
                Location-based Insights
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-blue-400 rounded-full mt-2" />
                  <span>Analyze orders with detailed location data</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-blue-400 rounded-full mt-2" />
                  <span>Find best performing Products by geographic regions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-blue-400 rounded-full mt-2" />
                  <span>Track orders, sales channels and revenue by region</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-400" />
                Strategic Applications
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-blue-400 rounded-full mt-2" />
                  <span>Send location-specific holiday promotions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-blue-400 rounded-full mt-2" />
                  <span>Optimize ad spend by excluding low-performing regions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-blue-400 rounded-full mt-2" />
                  <span>Create region-specific discount campaigns</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart className="w-6 h-6 text-blue-400" />
                Product Performance Tracking
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-blue-400 rounded-full mt-2" />
                  <span>Track top products for specific regions by quantity sold and revenue contribution</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-blue-400 rounded-full mt-2" />
                  <span>Monitor refund rates and identify products needing attention or discontinuation</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-blue-400 rounded-full mt-2" />
                  <span>Analyze bundling opportunities and optimize pricing strategies</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="text-left mb-4 md:mb-0">
              <span className="font-bold text-xl text-blue-400">MappBook</span>
              <p className="text-gray-400 text-sm mt-2">Location Analytics for Amazon Sellers</p>
            </div>
            <div className="flex gap-6 text-gray-400">
              <Link href="/privacy" className="hover:text-blue-400 transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-blue-400 transition">Terms of Service</Link>
              <Link href="/contact" className="hover:text-blue-400 transition">Contact Support</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} MappBook. All rights reserved. Not affiliated with Amazon.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;