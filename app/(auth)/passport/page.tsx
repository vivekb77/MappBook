"use client";

import type { NextPage } from 'next';
import PassportFlipBook from '@/components/Passport/FlipBook';

const Home: NextPage = () => {
  const locations = [
    {
      "place_name": "Miami",
      "place_country": "USA",
  },
  {
    "place_name": "Mexico City",
    "place_country": "Mexico",
  },
  {
    "place_name": "Toronto",
    "place_country": "Canada",
  }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <PassportFlipBook locations={locations} />
    </div>
  );
};

export default Home;