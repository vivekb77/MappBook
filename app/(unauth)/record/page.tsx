// app/record/page.tsx
"use client";
import PassportFlipBook from '@/components/Passport/FlipBook';

export default function RecordPage() {
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
    },
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
    },
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
    },
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
    },
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
    },
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
    <div className="h-[1920px] w-[1080px] bg-[#F5E6D3] overflow-hidden">
      <PassportFlipBook locations={locations} />
    </div>
  );
}