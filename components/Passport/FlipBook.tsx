import React from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Loader2 } from 'lucide-react';

interface Location {
  place_names: string[];
  place_country: string;
  place_country_code: string;
}



interface Stamp {
  country: string;
  country_code: string;
  svgCode: string;
}

interface CityStamp extends Stamp {
  city: string;
}

interface PassportPageProps {
  location?: Location;
  pageNumber: number;
  countryStamps: Stamp[];
  cityStamps: CityStamp[];
}

const PassportCover = React.forwardRef<HTMLDivElement>((_, ref) => (
  <div 
    ref={ref}
    className="relative h-full w-full bg-neutral-100 rounded shadow-lg"
    data-density="hard"
  >
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
      <div className="text-center p-8 rounded-lg bg-white/90 border-4 border-double border-neutral-300">
        <h1 className="text-3xl font-serif mb-2 text-neutral-800">
          TRAVEL MEMORIES
        </h1>
        <div className="text-sm text-neutral-600 mt-4 font-serif">
          Anno Domini MMXXIV
        </div>
      </div>
    </div>
  </div>
));

const PassportPage = React.forwardRef<HTMLDivElement, PassportPageProps>(
  ({ location, countryStamps, cityStamps, pageNumber }, ref) => {
    if (!location) return null;

    const matchingCountryStamp = countryStamps.find(
      stamp => stamp.country_code.toLowerCase() === location.place_country_code.toLowerCase()
    );

    const matchingCityStamps = location.place_names
      .map(placeName => cityStamps.find(stamp => 
        stamp.city.toLowerCase() === placeName.toLowerCase() &&
        stamp.country_code.toLowerCase() === location.place_country_code.toLowerCase()
      ))
      .filter((stamp): stamp is CityStamp => stamp !== undefined);

    return (
      <div
        ref={ref}
        className="relative h-full w-full bg-white rounded shadow-lg"
      >
        <div className="absolute inset-0 p-8">
          <h2 className="text-xl font-semibold mb-4 text-neutral-800">
            {location.place_country}
          </h2>
          
          {matchingCountryStamp && (
            <div className="flex justify-center mt-4">
              <div className="w-64 h-64 relative transform -rotate-12">
                <div 
                  className="absolute inset-0"
                  dangerouslySetInnerHTML={{
                    __html: matchingCountryStamp.svgCode.replace('<svg', '<svg class="w-full h-full"')
                  }} 
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center items-end gap-6 mt-8">
            {matchingCityStamps.map((stamp, index) => (
              <div 
                key={index}
                className="relative w-48 h-48 transform rotate-12"
              >
                <div 
                  className="absolute inset-0"
                  dangerouslySetInnerHTML={{
                    __html: stamp.svgCode.replace('<svg', '<svg class="w-full h-full"')
                  }} 
                />
              </div>
            ))}
          </div>

          <div className="absolute bottom-4 right-8 text-sm text-neutral-400">
            {pageNumber}
          </div>
        </div>
      </div>
    );
  }
);

const PassportFlipBook: React.FC<{ locations: Location[] }> = ({ locations }) => {
  const [page, setPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [orientation, setOrientation] = React.useState('landscape');
  const [state, setState] = React.useState('read');
  const [countryStamps, setCountryStamps] = React.useState<Stamp[]>([]);
  const [cityStamps, setCityStamps] = React.useState<CityStamp[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const flipBook = React.useRef<any>(null);

  const validLocations = React.useMemo(() => {
    if (!countryStamps.length) return [];
    return locations.filter(location => {
      const hasCountryStamp = countryStamps.some(
        stamp => stamp.country_code.toLowerCase() === location.place_country_code.toLowerCase()
      );
      const hasCityStamp = location.place_names.some(placeName =>
        cityStamps.some(stamp => 
          stamp.city.toLowerCase() === placeName.toLowerCase() &&
          stamp.country_code.toLowerCase() === location.place_country_code.toLowerCase()
        )
      );
      return hasCountryStamp || hasCityStamp;
    });
  }, [locations, countryStamps, cityStamps]);

  React.useEffect(() => {
    const loadStamps = async () => {
      try {
        const [countryResponse, cityResponse] = await Promise.all([
          fetch('/country_stamps.json'),
          fetch('/city_stamps.json')
        ]);

        if (!countryResponse.ok || !cityResponse.ok) {
          throw new Error('Failed to load stamps data');
        }

        const countryData = await countryResponse.json();
        const cityData = await cityResponse.json();

        setCountryStamps(countryData.country_stamps);
        setCityStamps(cityData.city_stamps);
      } catch (err) {
        console.error('Error loading stamps:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStamps();
  }, []);

  React.useEffect(() => {
    setTotalPages(validLocations.length + 2);
  }, [validLocations.length]);

  const nextPage = () => {
    if (flipBook.current?.pageFlip()) {
      flipBook.current.pageFlip().flipNext();
    }
  };

  const prevPage = () => {
    if (flipBook.current?.pageFlip()) {
      flipBook.current.pageFlip().flipPrev();
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-neutral-500" />
          <p className="text-xl text-neutral-600">Loading your passport...</p>
        </div>
      </div>
    );
  }
 
  return (
    <div className="flex flex-col items-center gap-8 p-8 min-h-screen bg-neutral-100" data-testid="flipbook-container">
    {/* Wooden table background with test id for recording */}
    <div 
      data-testid="wooden-background"
      className="w-full max-w-5xl p-12 rounded-lg shadow-xl"
      style={{
        background: 'linear-gradient(45deg, #8B4513, #A0522D, #8B4513)',
        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.3)',
        border: '1px solid #6B3511'
      }}
    >
      {/* Book container with subtle elevation */}
      <div className="relative">
        {/* Subtle shadow under the book */}
        <div className="absolute -inset-4 bg-black/20 blur-xl rounded-full"></div>
        
        <div className="relative">
          <HTMLFlipBook
            width={550}
            height={733}
            size="stretch"
            minWidth={315}
            maxWidth={1000}
            minHeight={400}
            maxHeight={1533}
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={true}
            onFlip={(e) => setPage(e.data)}
            onChangeOrientation={(e) => setOrientation(e.data)}
            onChangeState={(e) => setState(e.data)}
            className="demo-book"
            ref={flipBook}
          >
            <PassportCover />
            {validLocations.map((location, index) => (
              <PassportPage
                key={`${location.place_country}-${index}`}
                location={location}
                countryStamps={countryStamps}
                cityStamps={cityStamps}
                pageNumber={index + 1}
              />
            ))}
            <PassportCover />
          </HTMLFlipBook>
        </div>
      </div>
    </div>

    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={prevPage}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Previous page
        </button>
        <span className="text-neutral-600">
          [{page} of {totalPages}]
        </span>
        <button
          onClick={nextPage}
          data-testid="flip-button"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Next page
        </button>
      </div>
      <div className="text-neutral-600">
        State: <i>{state}</i>, orientation: <i>{orientation}</i>
      </div>
    </div>
  </div>
);
};

export default PassportFlipBook;