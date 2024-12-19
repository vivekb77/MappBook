import React, { useState } from 'react';
import { Globe2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Location {
  place_names: string[];
  place_country: string;
  place_country_code: string;
}

interface VisitedPlacesPopUpProps {
  fetchUserPlaces: (userId: string) => Promise<Location[]>;
  userId: string;
}

const VisitedPlacesPopUp = ({ fetchUserPlaces, userId }: VisitedPlacesPopUpProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPlaces = locations.reduce((acc, curr) => acc + curr.place_names.length, 0);
  const totalCountries = locations.length;

  const handleOpenPopup = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedLocations = await fetchUserPlaces(userId);
      setLocations(fetchedLocations);
      setIsOpen(true);
    } catch (err) {
      setError('Failed to load travel data. Please try again.');
      console.error('Error loading places:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpenPopup}
        disabled={isLoading}
        className="p-2 rounded-xl bg-white/80 text-purple-500 hover:bg-purple-50 transition-colors duration-300 disabled:opacity-50"
      >
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Globe2 className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              Available Stamps
            </span>
          </div>
        </div>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] sm:w-[600px] max-h-[80vh] rounded-2xl bg-gradient-to-br from-pink-100 to-purple-50 p-0 border-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-semibold text-center bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Your Travel Adventures
            </DialogTitle>
            <p className="text-center text-gray-600 mt-2">
              Your adventure passport will be created with virtual visas of these Countries
            </p>
            <p className="text-xs text-center text-gray-600 mt-2">
              Please note: Some of the countries in your visited list won't show here as Visa stamps are currently available for select countries only. We're continuously working to expand our collection of virtual visa stamps.
            </p>
          </DialogHeader>

          <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
            {error ? (
              <div className="bg-white/80 rounded-xl p-4 text-center shadow-sm">
                <div className="text-sm text-red-500">
                  {error}
                </div>
              </div>
            ) : locations.length > 0 ? (
              <div className="bg-white/80 rounded-xl p-4 shadow-sm">
                <div className="space-y-2">
                  {locations.map((location, index) => (
                    <div key={`${location.place_country}-${index}`} className="border-b border-purple-100 last:border-b-0 py-2">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-sm font-medium text-purple-600 min-w-[100px] flex items-center gap-2">
                          {location.place_country_code && (
                            <img
                              src={`https://flagcdn.com/24x18/${location.place_country_code.toLowerCase()}.png`}
                              alt={location.place_country}
                              className="w-4 h-3 object-cover"
                            />
                          )}
                          {location.place_country}
                        </span>
                        <span className="text-sm text-gray-600 text-right">
                          {location.place_names.join(', ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white/80 rounded-xl p-4 text-center shadow-sm">
                <div className="text-sm text-gray-500">
                  No places visited yet. Add Places by clicking on Add button.
                </div>
              </div>
            )}

            {locations.length > 0 && (
              <div className="bg-white/80 rounded-xl p-4 text-center shadow-sm">
                <div className="text-sm text-purple-500">
                  🌎 {totalCountries} {totalCountries === 1 ? 'Country' : 'Countries'} Explored
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {totalPlaces} {totalPlaces === 1 ? 'Place' : 'Places'} Visited
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisitedPlacesPopUp;