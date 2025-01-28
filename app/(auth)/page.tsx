"use client"
import React from 'react';
import { Globe, MapPin, DollarSign, BarChart, Lock, CloudUpload, Zap, Mail, Target, Filter } from 'lucide-react';
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
            <span className="text-yellow-400 font-semibold">Trusted by 5,000+ Amazon Sellers</span>
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
          <p className="mt-4 text-sm text-gray-400">No credit card required • 7-day free trial</p>
        </div>
      </section>

      

      {/* New Use Cases Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6">Powerful Use Cases</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-6 h-6 text-blue-400" />
                Location-based Insights
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-blue-400 rounded-full mt-2" />
                  <span>Export and analyze complete customer lists with detailed location data</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-blue-400 rounded-full mt-2" />
                  <span>Group customers by geographic regions for targeted marketing</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-blue-400 rounded-full mt-2" />
                  <span>Track customer count and revenue by region</span>
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
                  <span>Send location-specific holiday promotions (e.g., St. Patrick's Day deals for Irish customers)</span>
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
                  <span>Track top 10 products with detailed metrics on quantity sold and revenue contribution</span>
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

          {/* Features Grid */}
          <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Globe className="w-12 h-12 text-blue-500" />}
            title="Customer Location Analysis"
            description="Identify your top customer locations and track revenue by continent, country, state, and county levels"
          />
          <FeatureCard
            icon={<Target className="w-12 h-12 text-blue-500" />}
            title="Smart Ad Targeting"
            description="Optimize ad campaigns by targeting high-value regions and excluding low-performing locations"
          />
          <FeatureCard
            icon={<Mail className="w-12 h-12 text-blue-500" />}
            title="Geo-targeted Marketing"
            description="Send customized festival emails and promotions based on customer locations"
          />
        </div>
      </section>
        

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="font-bold text-xl text-blue-400">MappBook</span>
              <p className="text-gray-400 text-sm mt-2">Geotargeting Analytics for Amazon Sellers</p>
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