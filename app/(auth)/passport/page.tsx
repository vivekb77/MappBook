"use client";

import type { NextPage } from 'next';
import PassportFlipBook from '@/components/Passport/FlipBook';
import { useState } from 'react';

const Home: NextPage = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const locations = [
    {
      "place_name": "Toronto",
      "place_country": "Canada",
    },
    {
      "place_name": "Miami",
      "place_country": "USA",
    },
    {
      "place_name": "Mexico City",
      "place_country": "Mexico",
    }
    
  ];

  const generateVideo = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/videoGenerator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locations }),
      });
      
      if (!response.ok) throw new Error('Failed to generate video');
      
      const data = await response.json();
      setVideoUrl(data.videoUrl);
    } catch (error) {
      console.error('Error generating video:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
      
      
      <PassportFlipBook locations={locations} />

      
      <div className="mt-8 flex gap-4">
        <button
          onClick={generateVideo}
          disabled={isGenerating}
          className="px-6 py-3 rounded-lg font-serif bg-[#8B7355] hover:bg-[#9C8468] text-[#F5E6D3] disabled:opacity-50"
        >
          {isGenerating ? 'Generating Video...' : 'Generate Video'}
        </button>
      </div>
      
      {videoUrl && (
        <div className="mt-8">
          <video 
            controls 
            className="max-w-xl rounded-lg shadow-lg"
            src={videoUrl}
          />
        </div>
      )}
    </div>
  );
};

export default Home;