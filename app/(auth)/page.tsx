"use client"
import React from 'react';
import { Globe, MapPin, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { track } from '@vercel/analytics';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

track('Amazon Analytics - Landing page viewed');

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="bg-gray-800 p-6 rounded-xl text-center">
    <div className="mb-4 flex justify-center">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </div>
);

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="absolute top-4 left-4 z-50">
        <div className="bg-gray-800/90 p-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors border border-gray-700">
          <span className="font-bold text-xl text-blue-400">MappBook</span>
        </div>
      </div>

      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mt-8">
          <h1 className="text-4xl font-bold mb-6">
            Geotargeting Analytics for Amazon Sellers
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Understand your customer locations and optimize your marketing strategy with detailed geographic insights.
          </p>
          <Link href="/amazonanalytics">
            <button className="px-8 py-4 bg-blue-500 rounded-lg text-lg font-semibold hover:bg-blue-600 transition">
              Start Analyzing
            </button>
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Globe className="w-12 h-12 text-blue-500" />}
            title="Global Customer Insights"
            description="Track customer distribution and revenue across countries, states, and regions"
          />
          <FeatureCard
            icon={<MapPin className="w-12 h-12 text-blue-500" />}
            title="Location Analytics"
            description="Identify your most valuable customer locations and market opportunities"
          />
          <FeatureCard
            icon={<DollarSign className="w-12 h-12 text-blue-500" />}
            title="Revenue Mapping"
            description="Visualize revenue distribution by geographic area for targeted growth"
          />
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 mb-16">
        <div className="bg-gray-800 rounded-xl p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <ol className="space-y-4 text-gray-300">
            <li className="flex gap-3">
              <span className="font-bold text-blue-400">1.</span>
              Upload your Amazon Seller Central order reports
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-400">2.</span>
              Get instant geographic analysis of your customer base
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-400">3.</span>
              Make data-driven decisions for regional targeting
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;