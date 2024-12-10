import React from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Loader2 } from 'lucide-react';

interface Location {
  place_names: string[];
  place_country: string;
  place_country_code: string;
}

// Add interface for HTMLFlipBook props
interface HTMLFlipBookProps {
  width: number;
  height: number;
  size: "fixed" | "stretch";
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  maxShadowOpacity: number;
  showCover: boolean;
  mobileScrollSupport: boolean;
  onFlip: (e: { data: number }) => void;
  className?: string;
  startPage?: number;
  drawShadow?: boolean;
  flippingTime?: number;
  usePortrait?: boolean;
  startZIndex?: number;
  autoSize?: boolean;
  clickEventForward?: boolean;
  useMouseEvents?: boolean;
  swipeDistance?: number;
  showPageCorners?: boolean;
  disableFlipByClick?: boolean;
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
  isFirst?: boolean;
  isLast?: boolean;
  countryStamps: Stamp[];
  cityStamps: CityStamp[];
}

interface PassportFlipBookProps {
  locations: Location[];
}

const PassportCover = React.forwardRef<HTMLDivElement>((_, ref) => (
  <div
    ref={ref}
    className="relative h-full w-full rounded-xl"
    style={{
      backgroundColor: '#8B7355',
      backgroundImage: `
        linear-gradient(45deg, #8B7355 25%, #9C8468 25%, #9C8468 50%, #8B7355 50%, #8B7355 75%, #9C8468 75%, #9C8468 100%)
      `,
      backgroundSize: '20px 20px',
    }}
    data-density="hard"
  >
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
      <div
        className="text-center p-8 rounded-lg"
        style={{
          backgroundColor: 'rgba(139, 115, 85, 0.9)',
          border: '4px double #463E33',
        }}
      >
        <h1 className="text-2xl font-serif mb-2 text-[#463E33]" style={{ fontFamily: 'Garamond, serif' }}>
          TRAVEL MEMORIES
        </h1>
        <div className="text-xs text-[#463E33] mt-4 font-serif">Anno Domini MMXXIV</div>
      </div>
    </div>
  </div>
));


const PassportPage = React.forwardRef<HTMLDivElement, PassportPageProps>(
  ({ location, countryStamps, cityStamps }, ref) => {
    if (!location) return null;

    const matchingCountryStamp = countryStamps.find(
      stamp => stamp.country_code.toLowerCase() === location.place_country_code.toLowerCase()
    );

    const matchingCityStamps: CityStamp[] = location.place_names
      .map(placeName => {
        const cityStamp = cityStamps.find(stamp => {
          const cityMatch = stamp.city.toLowerCase() === placeName.toLowerCase();
          const countryMatch = stamp.country_code.toLowerCase() === location.place_country_code.toLowerCase();
          return cityMatch && countryMatch;
        });
        return cityStamp;
      })
      .filter((stamp): stamp is CityStamp => stamp !== undefined);

    return (
      <div
        ref={ref}
        className="relative h-full w-full p-8 rounded-xl"
        style={{
          backgroundColor: '#F5E6D3',
          backgroundImage: `
            radial-gradient(#D2B48C 2px, transparent 2px),
            radial-gradient(#D2B48C 2px, transparent 2px)
          `,
          backgroundSize: '30px 30px',
          backgroundPosition: '0 0, 15px 15px',
        }}
      >
        <div
          className="border-4 border-double h-full w-full p-6 rounded-lg"
          style={{
            backgroundColor: 'rgba(245, 230, 211, 0.9)',
            boxShadow: 'inset 0 0 20px rgba(139, 115, 85, 0.2)',
          }}
        >
          <div className="flex flex-col h-full">
            {matchingCountryStamp && (
              <div className="flex justify-center mt-8">
                <div className="w-72 h-72 relative transform -rotate-12"> {/* Increased size */}
                  <div 
                    className="absolute inset-0"
                    dangerouslySetInnerHTML={{
                      __html: matchingCountryStamp.svgCode.replace('<svg', '<svg class="w-full h-full"')
                    }} 
                  />
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-wrap justify-center items-end gap-6 mt-12">
              {matchingCityStamps.map((stamp, index) => (
                <div 
                  key={index}
                  className="relative w-56 h-56 transform rotate-12"
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
          </div>
        </div>
      </div>
    );
  }
);


const PassportFlipBook: React.FC<PassportFlipBookProps> = ({ locations }) => {
  const [pageState, setPageState] = React.useState({
    page: 0,
    totalPages: locations.length + 2,
    isAutoFlipping: false
  });

  const [countryStamps, setCountryStamps] = React.useState<Stamp[]>([]);
  const [cityStamps, setCityStamps] = React.useState<CityStamp[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const flipBookRef = React.useRef<any>(null);
  const autoFlipIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Instagram Reels / TikTok dimensions (9:16 aspect ratio)
  const containerWidth = 1080;
  const containerHeight = 1920;
  
  // Calculate book dimensions for single page view
  // Make the book wider relative to height since we're only showing one page
  const bookWidth = containerWidth * 0.85;  // 85% of width for single page
  const bookHeight = bookWidth * 1.4;       // taller ratio for single page
  
  // Center position for the book
  const bookTopPosition = (containerHeight - bookHeight) / 2;


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
    setPageState(prev => ({
      ...prev,
      totalPages: validLocations.length + 2
    }));
  }, [validLocations.length]);

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

  const startAutoFlip = () => {
    setPageState(prev => ({ ...prev, isAutoFlipping: true }));

    const flipNextPage = () => {
      if (flipBookRef.current?.pageFlip()) {
        const current = flipBookRef.current.pageFlip().getCurrentPageIndex();
        if (current >= pageState.totalPages - 1) {
          flipBookRef.current.pageFlip().flip(0);
          stopAutoFlip();
        } else {
          flipBookRef.current.pageFlip().flipNext();
          setTimeout(flipNextPage, 3000);
        }
      }
    };

    setTimeout(flipNextPage, 1000);
  };

  const stopAutoFlip = () => {
    if (autoFlipIntervalRef.current) {
      clearInterval(autoFlipIntervalRef.current);
      autoFlipIntervalRef.current = null;
    }
    setPageState(prev => ({ ...prev, isAutoFlipping: false }));
  };

  React.useEffect(() => {
    return () => {
      if (autoFlipIntervalRef.current) {
        clearInterval(autoFlipIntervalRef.current);
      }
    };
  }, []);

  const handlePageFlip = (e: { data: number }) => {
    setPageState(prev => ({
      ...prev,
      page: e.data,
    }));
  };

  if (isLoading) {
    return (
      <div className="h-[1920px] w-[1080px] bg-[#F5E6D3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
          <p className="text-xl text-gray-600">Loading your passport...</p>
        </div>
      </div>
    );
  }

  return (
   <div
      data-testid="flipbook-container"
      className="relative"
      style={{
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        overflow: 'hidden',
        backgroundColor: '#F5E6D3'
      }}
    >
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ marginTop: `${bookTopPosition}px` }}
      >
        <HTMLFlipBook
          width={bookWidth}
          height={bookHeight}
          size="stretch"
          minWidth={bookWidth}
          maxWidth={bookWidth}
          minHeight={bookHeight}
          maxHeight={bookHeight}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={handlePageFlip}
          ref={flipBookRef}
          useMouseEvents={true}
          className="flip-book"
          startPage={0}
          drawShadow={true}
          flippingTime={1000}
          usePortrait={true}        // Changed to true for single page
          startZIndex={0}
          autoSize={true}
          clickEventForward={false}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
          style={{
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          }}
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

        <div 
          className="absolute"
          style={{
            bottom: `${containerHeight * 0.1}px`,
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          <button
            onClick={pageState.isAutoFlipping ? stopAutoFlip : startAutoFlip}
            data-testid="flip-button"
            className="opacity-0 px-6 py-3 rounded-lg font-serif bg-[#8B7355] hover:bg-[#9C8468] text-[#F5E6D3]"
            style={{ fontFamily: 'Garamond, serif' }}
          >
            {pageState.isAutoFlipping ? 'Pause Journey' : 'Begin Journey'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PassportFlipBook;