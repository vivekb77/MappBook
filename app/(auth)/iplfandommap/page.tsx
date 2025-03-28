"use client"
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import GeoJSON directly
import indiaStatesGeoJson from '../../../public/india-states.json';

// Types
interface Geometry {
  type: string;
  coordinates: any[];
}

interface Feature {
  type: string;
  properties: {
    name?: string;
    [key: string]: any;
  };
  geometry: Geometry;
}

interface GeoJSON {
  type: string;
  features: Feature[];
}

// Dynamically import MapContainer to prevent SSR issues
const MapContainerWithNoSSR = dynamic(() => import('../../../components/Surveys/create/MapContainer'), {
  ssr: false,
});

const SurveyCreatePage: React.FC = () => {
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON | null>(null);

  // Load GeoJSON data once on component mount
  useEffect(() => {
    try {
      // Use the imported GeoJSON data directly
      setGeoJsonData(indiaStatesGeoJson);
    } catch (err) {
      console.error('Error loading GeoJSON:', err);
    }
  }, []);

  // Apply styles to prevent scrolling on the page
  useEffect(() => {
    // Add overflow hidden to body
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Cleanup function to remove the styles when the component unmounts
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  if (!geoJsonData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 overflow-hidden">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mb-4"></div>
          <p className="text-gray-700 text-lg">Loading map data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <MapContainerWithNoSSR geoJsonData={geoJsonData} />
    </div>
  );
};

export default SurveyCreatePage;