import React from 'react';
import { Camera, Globe, Map, Video } from 'lucide-react';
import Link from 'next/link';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Navigation */}
      <nav className="p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-500">MappBook</div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">
            Create Stunning Drone-Like Footage Using Maps
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Transform your map exploration into cinematic experiences. No drone required.
          </p>
          <Link href="/create">
            <button className="px-8 py-4 bg-blue-500 rounded-lg text-lg font-semibold hover:bg-blue-600 transition">
              Start Creating
            </button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Globe className="w-12 h-12 text-blue-500" />}
            title="Global Coverage"
            description="Access detailed maps from anywhere in the world"
          />
          <FeatureCard 
            icon={<Camera className="w-12 h-12 text-blue-500" />}
            title="Cinematic Paths"
            description="Design smooth camera movements and transitions"
          />
          <FeatureCard 
            icon={<Video className="w-12 h-12 text-blue-500" />}
            title="Easy Export"
            description="Export your creations in high quality video formats"
          />
        </div>
      </section>

      {/* Demo Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gray-800 rounded-xl p-8">
          <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Map className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Preview your creation here</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl text-center">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
};

export default LandingPage;