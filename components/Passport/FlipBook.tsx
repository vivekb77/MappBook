import React from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Loader2 } from 'lucide-react';

interface Location {
  place_names: string[];
  place_country: string;
  place_country_code: string;
}

interface FlipBookProps {
  width: number;
  height: number;
  size: "fixed" | "stretch";
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  drawShadow?: boolean;
  flippingTime?: number;
  usePortrait?: boolean;
  startPage?: number;
  maxShadowOpacity?: number;
  showCover?: boolean;
  mobileScrollSupport?: boolean;
  onFlip?: (e: any) => void;
  onChangeOrientation?: (e: any) => void;
  onChangeState?: (e: any) => void;
  className?: string;
  style?: React.CSSProperties;
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
  countryStamps: Stamp[];
  cityStamps: CityStamp[];
}

const PassportCover = React.forwardRef<HTMLDivElement>((_, ref) => (
  <div 
    ref={ref}
    className="relative h-full w-full overflow-hidden"
    data-density="hard"
  >
    {/* Base page with background image */}
    <div 
      className="absolute top-0 left-0 right-0 bottom-0 w-full h-full"
      style={{
        backgroundImage: 'url("/passportfrontcover.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#4A3728', // Fallback
        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)'
      }}
    >
      {/* Darkening overlay */}
      <div className="absolute inset-0 bg-black/30" />
    </div>
    
    {/* Content */}
    <div className="relative h-full w-full flex flex-col items-center justify-center p-8 z-10">
      <div className="text-center p-8">
        <h1 className="text-4xl font-serif mb-4 text-amber-100" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
          ITER MEMORIAE
        </h1>
        <div className="font-serif text-2xl text-amber-100 mt-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
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

    // 10 fixed positions spread around the page (left%, top%, rotation)
    const FIXED_POSITIONS = [
      { left: 25, top: 25, rotation: -15 },  // Top left
      { left: 75, top: 25, rotation: 15 },   // Top right
      { left: 25, top: 75, rotation: 15 },   // Bottom left
      { left: 75, top: 75, rotation: -15 },  // Bottom right
      { left: 50, top: 20, rotation: 0 },    // Top center
      { left: 50, top: 80, rotation: 0 },    // Bottom center
      { left: 20, top: 50, rotation: -20 },  // Left center
      { left: 80, top: 50, rotation: 20 },   // Right center
      { left: 35, top: 40, rotation: 10 },   // Upper left middle
      { left: 65, top: 60, rotation: -10 }   // Lower right middle
    ];

    return (
      <div
        ref={ref}
        className="relative h-full w-full overflow-hidden"
      >
        {/* Base page with background image */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'url("/passport_page.jpg")',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
            backgroundColor: '#F5E6D3',
            width: '100%',
            height: '100%'
          }}
        />
        
        {/* Content container */}
        <div className="relative h-full w-full">
          {/* Country stamp in center */}
          {matchingCountryStamp && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div 
                className="w-64 h-64 relative"
                style={{
                  filter: 'sepia(0.6) brightness(0.8)',
                  mixBlendMode: 'multiply'
                }}
              >
                <div 
                  className="absolute inset-0"
                  dangerouslySetInnerHTML={{
                    __html: matchingCountryStamp.svgCode.replace('<svg', '<svg class="w-full h-full"')
                  }} 
                />
              </div>
            </div>
          )}

          {/* City stamps */}
          {matchingCityStamps.map((stamp, index) => {
            if (index >= FIXED_POSITIONS.length) return null;
            const position = FIXED_POSITIONS[index];
            
            return (
              <div 
                key={`${stamp.city}-${index}-${pageNumber}`}
                className="absolute w-32 h-32"
                style={{
                  left: `${position.left}%`,
                  top: `${position.top}%`,
                  transform: `translate(-50%, -50%) rotate(${position.rotation}deg)`,
                  filter: 'sepia(0.6) brightness(0.8)',
                  mixBlendMode: 'multiply',
                  zIndex: 10
                }}
              >
                <div 
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{
                    __html: stamp.svgCode.replace('<svg', '<svg class="w-full h-full"')
                  }} 
                />
              </div>
            );
          })}

          {/* Page number */}
          <div className="absolute bottom-8 right-8 font-serif text-2xl text-amber-900 z-30">
            {toRomanNumeral(pageNumber)}
          </div>
        </div>
      </div>
    );
  }
);

// Helper function remains the same
const toRomanNumeral = (num: number): string => {
  const romanNumerals = [
    { value: 100, numeral: 'C' },
    { value: 90, numeral: 'XC' },
    { value: 50, numeral: 'L' },
    { value: 40, numeral: 'XL' },
    { value: 10, numeral: 'X' },
    { value: 9, numeral: 'IX' },
    { value: 5, numeral: 'V' },
    { value: 4, numeral: 'IV' },
    { value: 1, numeral: 'I' }
  ];

  let result = '';
  let remaining = num;

  for (const { value, numeral } of romanNumerals) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }

  return result;
};

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
    setTotalPages(validLocations.length + 0);
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
      className="w-full max-w-5xl p-12 rounded-lg relative overflow-hidden"
      style={{
        backgroundImage: 'url("/booktable.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.3)'
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
              style={{}}
              startPage={0}
              startZIndex={0}
              drawShadow={true}
              flippingTime={1000}
              usePortrait={false}
              autoSize={true}
              clickEventForward={false}
              useMouseEvents={true}
              swipeDistance={0}
              showPageCorners={true}
              disableFlipByClick={false}
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