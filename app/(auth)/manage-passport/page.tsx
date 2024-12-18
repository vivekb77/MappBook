"use client"
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { UserButton } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface CityStamp {
  country: string;
  country_code: string;
  city: string;
  svgCode: string;
}

interface CountryStamp {
  country: string;
  country_code: string;
}

const TravelStampsPage = () => {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [countryStamps, setCountryStamps] = useState<CountryStamp[]>([]);
  const [cityStamps, setCityStamps] = useState<CityStamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stampErrors, setStampErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      if (!isSignedIn) return;
      
      try {
        const [countryResponse, cityResponse] = await Promise.all([
          fetch('/api/get-assets?type=json&name=country_stamps.json'),
          fetch('/api/get-assets?type=json&name=city_stamps.json')
        ]);

        if (!countryResponse.ok || !cityResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const countryData: { country_stamps: CountryStamp[] } = await countryResponse.json();
        const cityData: { city_stamps: CityStamp[] } = await cityResponse.json();

        setCountryStamps(countryData.country_stamps);
        setCityStamps(cityData.city_stamps);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stamp data');
        setLoading(false);
      }
    };

    fetchData();
  }, [isSignedIn]);

  const handleStampError = (countryCode: string) => {
    setStampErrors(prev => new Set(Array.from(prev).concat(countryCode)));
  };

  if (!isLoaded || (isSignedIn && loading)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-5">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-purple-100" />
            <div 
              className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-t-[3px] border-pink-400"
              style={{ animationDirection: 'reverse' }} 
            />
          </div>
          <span className="text-lg font-medium text-gray-700">
            {!isLoaded ? 'Checking authentication...' : 'Loading Stamps'}
          </span>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const StampImage = ({ svgCode }: { svgCode: string }) => (
    <div 
      className="w-48"
      dangerouslySetInnerHTML={{ __html: svgCode }}
    />
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold">Adventure Passport Stamps</h1>
            <div className="flex items-center gap-4">
              {user && <span className="text-sm text-gray-600">Welcome, {user.firstName}</span>}
              <UserButton afterSignOutUrl="/"/>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">#</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Country</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Country Stamp</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cities</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">City Stamps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {countryStamps.map((country, index) => {
                    const citiesInCountry = cityStamps.filter(
                      city => city.country_code === country.country_code
                    );
                    const countryCode = country.country_code.toLowerCase();

                    return (
                      <tr key={country.country_code} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {country.country} / {country.country_code}
                        </td>
                        <td className="px-6 py-4">
                          {!stampErrors.has(countryCode) && (
                            <div className="w-48 h-48 relative">
                              <img
                                src={`/stamps/${countryCode.toUpperCase()}.png`}
                                alt={`${country.country} stamp`}
                                className="w-full h-full object-contain"
                                onError={() => handleStampError(countryCode)}
                                style={{
                                  filter: 'sepia(0.6) brightness(0.8)',
                                  mixBlendMode: 'multiply'
                                }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {citiesInCountry.map(city => city.city).join(', ')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-4">
                            {citiesInCountry.map((city, index) => (
                              <StampImage key={`${city.country_code}-${city.city}-${index}`} svgCode={city.svgCode} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelStampsPage;