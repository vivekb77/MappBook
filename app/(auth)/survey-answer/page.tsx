"use client"
import React from 'react';
import { BarChart, MapPin, Target, Layers, Globe, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { track } from '@vercel/analytics';
// import SurveyMapDemo from '@/components/Surveys/DemoMap';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

track('SurveyMap - Landing page viewed');

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="bg-indigo-900 p-6 rounded-xl text-center hover:transform hover:scale-105 transition-all duration-300 hover:shadow-xl border border-indigo-700">
    <div className="mb-4 flex justify-center">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-black text-white">
      {/* Header */}
      <header className="absolute top-4 left-4 z-50">
        <div className="bg-indigo-900/90 p-2 rounded-lg shadow-lg hover:bg-indigo-800 transition-colors border border-indigo-700">
          <span className="font-bold text-xl text-green-400">SurveyMap</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-green-400 animate-pulse" />
            <span className="text-green-400 font-semibold">Transforming location-based insights</span>
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Visualize Survey Data Across<br />
            <span className="bg-gradient-to-r from-green-400 to-teal-500 bg-clip-text text-transparent">
              Geographic Landscapes
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Create, deploy, and analyze surveys with powerful geographic visualization. Discover patterns and insights that traditional surveys can't reveal.
          </p>
          <Link href="/demo">
            <button className="px-8 py-4 bg-green-500 rounded-lg text-lg font-semibold hover:bg-green-600 transition transform hover:scale-105">
              Try Interactive Demo →
            </button>
          </Link>
          <p className="mt-4 text-sm text-gray-400">No registration required for demo</p>
        </div>
      </section>

      {/* Map Visualization Section */}
      <section className="container mx-auto px-4 py-7">
        <div className="relative rounded-xl overflow-hidden bg-indigo-900 border border-indigo-700">
          <img
            src="/hexagon-map-visualization.png"
            alt="Survey Map Visualization"
            className="w-full h-auto object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 to-transparent">
            <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Powerful Hexagonal Grid Analysis</h3>
              <p className="text-gray-300">Visualize survey responses with intuitive color-coded regions</p>
            </div>
          </div>
        </div>
        {/* <SurveyMapDemo/> */}
      </section>

      {/* Use Cases Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-indigo-900 rounded-xl p-8 border border-indigo-700">
          <h2 className="text-2xl font-bold mb-6">Transformative Insights Across Industries</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-indigo-950 p-6 rounded-lg border border-indigo-800">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-6 h-6 text-green-400" />
                Market Research
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2" />
                  <span>Identify regional consumer preferences and trends</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2" />
                  <span>Compare product adoption across different locations</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2" />
                  <span>Track brand perception geographic variations</span>
                </li>
              </ul>
            </div>
            <div className="bg-indigo-950 p-6 rounded-lg border border-indigo-800">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-green-400" />
                Public Opinion
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2" />
                  <span>Gather citizen feedback on community initiatives</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2" />
                  <span>Measure public sentiment on policy changes</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2" />
                  <span>Visualize voting patterns and political preferences</span>
                </li>
              </ul>
            </div>
            <div className="bg-indigo-950 p-6 rounded-lg border border-indigo-800">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Layers className="w-6 h-6 text-green-400" />
                Urban Planning
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2" />
                  <span>Map satisfaction with local infrastructure</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2" />
                  <span>Identify areas needing improved public services</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2" />
                  <span>Target development based on community priorities</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-12 text-center">Powerful Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<MapPin size={48} className="text-green-400" />}
            title="Geographic Precision"
            description="Visualize data with customizable hexagonal grid mapping at various scales - from neighborhoods to continents."
          />
          <FeatureCard
            icon={<Target size={48} className="text-green-400" />}
            title="Targeted Surveys"
            description="Deploy surveys to specific regions and demographics with precision targeting capabilities."
          />
          <FeatureCard
            icon={<BarChart size={48} className="text-green-400" />}
            title="Advanced Analytics"
            description="Analyze trends, compare regions, and generate insights with powerful data visualization tools."
          />
          <FeatureCard
            icon={<Sparkles size={48} className="text-green-400" />}
            title="Real-time Results"
            description="Watch response data populate your map in real-time as participants complete your surveys."
          />
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 rounded-xl p-10 text-center shadow-xl border border-indigo-700">
          <h2 className="text-3xl font-bold mb-4">Ready to Uncover Location-Based Insights?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join forward-thinking organizations using SurveyMap to discover geographic patterns in their data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="px-8 py-4 bg-green-500 rounded-lg text-lg font-semibold hover:bg-green-600 transition">
                Get Started Free
              </button>
            </Link>
            <Link href="/pricing">
              <button className="px-8 py-4 bg-transparent border border-white rounded-lg text-lg font-semibold hover:bg-white/10 transition">
                View Pricing
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-indigo-900 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-left mb-4 md:mb-0">
              <span className="font-bold text-xl text-green-400">SurveyMap</span>
              <p className="text-gray-400 text-sm mt-2">Location-Based Survey Platform</p>
            </div>
            <div className="flex gap-6 text-gray-400">
              <Link href="/privacy" className="hover:text-green-400 transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-green-400 transition">Terms of Service</Link>
              <Link href="/contact" className="hover:text-green-400 transition">Contact</Link>
              <Link href="/blog" className="hover:text-green-400 transition">Blog</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} SurveyMap. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;