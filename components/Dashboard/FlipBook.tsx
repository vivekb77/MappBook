import React, { useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Loader2 } from 'lucide-react';

interface Location {
  place_names: string[];
  place_country: string;
  place_country_code: string;
}

interface PassportFlipBookProps {
  locations: Location[];
  passportDisplayName?: string | null;
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

const PassportCover = React.forwardRef<HTMLDivElement, {
  position: 'frontCover' | 'frontInside' | 'backInside' | 'backCover';
  passportDisplayName?: string;
}>((props, ref) => {
  // Get image path based on position
  const getImagePath = () => {
    switch (props.position) {
      case 'frontCover':
        return '/api/get-assets?type=images&name=passportfrontcover.jpg';
      case 'frontInside':
        return '/api/get-assets?type=images&name=passportfrontinside.jpg';
      case 'backInside':
        return '/api/get-assets?type=images&name=passportbackinside.jpg';
      case 'backCover':
        return '/api/get-assets?type=images&name=passportbackcover.jpg';
      default:
        return '/api/get-assets?type=images&name=passportfrontcover.jpg';
    }
  };

  // Get quote based on position
  const getQuote = () => {
    switch (props.position) {
      case 'frontInside':
        return '"Civis Romanus sum" \n\n - I am a Roman citizen';
      case 'backInside':
        return (
          <div className="text-center space-y-8">
            <div className="font-cinzel text-lg text-stone-100" style={{
              letterSpacing: '0.1em',
              lineHeight: '2',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}>
              Datum Romae<br />
              Sub Sigillo Imperii<br />
              Ex Auctoritate Imperatoris
            </div>

            <div className="font-cinzel text-sm text-stone-100 mt-12 max-w-md" style={{
              letterSpacing: '0.05em',
              lineHeight: '1.8',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}>
              This document must be presented upon request to any official of the Empire.
              The bearer is granted safe passage throughout all territories under Roman rule.
              Let it be known that any who hinder the bearer's journey shall answer to Imperial law.
            </div>

            <div className="font-trajan text-base text-stone-100 mt-16" style={{
              letterSpacing: '0.15em',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}>
              PAX ROMANA
            </div>
          </div>
        );
      default:
        return '';
    }
  };

  // Only show title on front cover
  const showTitle = props.position === 'frontCover';
  const showBackTitle = props.position === 'backCover';
  const showQuote = ['frontInside', 'backInside'].includes(props.position);

  return (
    <div
      ref={ref}
      className="relative h-full w-full overflow-hidden rounded-3xl"
      data-density="hard"
    >
      {/* Base page with background image */}
      <div
        className="absolute top-0 left-0 right-0 bottom-0 w-full h-full"
        style={{
          backgroundImage: `url("${getImagePath()}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#4A3728',
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)'
        }}
      >
        {/* Darkening overlay */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content - Front Cover */}
      {showTitle && (
        <div className="relative h-full w-full flex flex-col items-center justify-center p-8 z-10">      <div className="text-center p-8 space-y-8">
          <div className="font-trajan text-3xl text-stone-100" style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            letterSpacing: '0.2em'
          }}>
            Adventure Passport
          </div>
          <div className="font-cinzel text-sm text-stone-200" style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            letterSpacing: '0.15em'
          }}>
            Of
          </div>
          <h1 className="text-5xl font-trajan text-stone-100 break-words max-w-md leading-tight" style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            letterSpacing: '0.25em'
          }}>
            {props.passportDisplayName || 'IMPERIVM ROMANVM'}
          </h1>
        </div>
        </div>
      )}
      {/* Content - Back Cover Title */}
      {showBackTitle && (
        <div className="relative h-full w-full flex flex-col items-center justify-center p-28 z-10">
          <div className="text-center space-y-12">
            <h1 className="text-x font-trajan text-stone-100 break-words max-w-md leading-tight" style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              letterSpacing: '0.2em'
            }}>
             
            </h1>
          </div>
        </div>
      )}
      {/* Quotes for Inside Covers */}
      {showQuote && (
        <div className="relative h-full w-full flex flex-col items-center justify-center p-8 z-10">
          <div className="text-center max-w-lg">
            {typeof getQuote() === 'string' ? (
              <p className="font-serif text-2xl text-amber-100 whitespace-pre-line leading-relaxed" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                {getQuote()}
              </p>
            ) : (
              getQuote()
            )}
          </div>
        </div>
      )}
      {/* Branding - Only on front and back covers */}
      {(props.position === 'frontCover' || props.position === 'backCover') && (
        <div className="absolute bottom-6 right-6 z-10">
          <p className="font-serif text-sm text-amber-100" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            Created using MappBook.com
          </p>
        </div>
      )}
    </div>
  );
});



const PassportPage = React.forwardRef<HTMLDivElement, PassportPageProps>(
  ({ location, cityStamps, pageNumber }, ref) => {
    if (!location) return null;

    const [countryStampError, setCountryStampError] = useState(false);

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

    const processedCities = new Set<string>();

    const matchingCityStamps = location.place_names
      .map(placeName => {
        // Convert to lowercase for consistent comparison
        const lowerPlaceName = placeName.toLowerCase();

        // If we've already processed this city, skip it
        if (processedCities.has(lowerPlaceName)) {
          return undefined;
        }

        const stamp = cityStamps.find(stamp =>
          stamp.city.toLowerCase() === lowerPlaceName &&
          stamp.country_code.toLowerCase() === location.place_country_code.toLowerCase()
        );

        // If we found a stamp, mark this city as processed
        if (stamp) {
          processedCities.add(lowerPlaceName);
        }

        return stamp;
      })
      .filter((stamp): stamp is CityStamp => stamp !== undefined);

    return (
      <div
        ref={ref}
        className="relative h-full w-full overflow-hidden rounded-3xl"
      >
        {/* Base page with background image */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            backgroundImage: 'url("/api/get-assets?type=images&name=passport_page.jpg")',
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
          {!countryStampError && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div
                className="w-64 h-64 relative"
                style={{
                  filter: 'sepia(0.6) brightness(0.8)',
                  mixBlendMode: 'multiply'
                }}
              >
                <img
                  src={`/stamps/${location.place_country_code.toUpperCase()}.png`}
                  alt={`${location.place_country_code} stamp`}
                  className="w-full h-full"
                  onError={() => setCountryStampError(true)}
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


// Helper function for Roman numerals
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

const PassportFlipBook: React.FC<{
  locations: Location[];
  passportDisplayName?: string;
}> = ({ locations, passportDisplayName }) => {
  const [page, setPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [orientation, setOrientation] = React.useState('landscape');
  const [state, setState] = React.useState('read');
  const [countryStamps, setCountryStamps] = React.useState<Stamp[]>([]);
  const [cityStamps, setCityStamps] = React.useState<CityStamp[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const flipBook = React.useRef<any>(null);
  const [imagesLoaded, setImagesLoaded] = React.useState(false);

  const coverImages = [
    '/api/get-assets?type=images&name=passportfrontcover.jpg',
    '/api/get-assets?type=images&name=passportfrontinside.jpg',
    '/api/get-assets?type=images&name=passportbackinside.jpg',
    '/api/get-assets?type=images&name=passportbackcover.jpg',
    '/api/get-assets?type=images&name=booktable.jpg',
    '/api/get-assets?type=images&name=passport_page.jpg'
  ];

  const validLocations = React.useMemo(() => {
    if (!countryStamps.length) return [];

    // First filter valid locations
    const filtered = locations.filter(location => {
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

    // Group locations by country and count places
    const countryGroups = filtered.reduce((acc, location) => {
      const countryCode = location.place_country_code;
      if (!acc[countryCode]) {
        acc[countryCode] = {
          locations: [],
          totalPlaces: 0,
          country: location.place_country
        };
      }
      acc[countryCode].locations.push(location);
      acc[countryCode].totalPlaces += location.place_names.length;
      return acc;
    }, {} as Record<string, {
      locations: Location[],
      totalPlaces: number,
      country: string
    }>);

    // Sort countries by total places (descending) and alphabetically for ties
    const sortedLocations = Object.values(countryGroups)
      .sort((a, b) => {
        // First sort by number of places
        const placeDiff = b.totalPlaces - a.totalPlaces;
        // If same number of places, sort alphabetically by country name
        if (placeDiff === 0) {
          return a.country.localeCompare(b.country);
        }
        return placeDiff;
      })
      .flatMap(group => group.locations);

    // If we have an odd number of locations, add an empty location to maintain even pages
    if (sortedLocations.length % 2 !== 0) {
      sortedLocations.push({
        place_names: [],
        place_country: "",
        place_country_code: ""
      });
    }

    return sortedLocations;
  }, [locations, countryStamps, cityStamps]);

  React.useEffect(() => {
    const loadAllResources = async () => {
      try {
        // Load stamps data
        const [countryResponse, cityResponse] = await Promise.all([
          fetch('/api/get-assets?type=json&name=country_stamps.json'),
          fetch('/api/get-assets?type=json&name=city_stamps.json')
        ]);

        if (!countryResponse.ok || !cityResponse.ok) {
          throw new Error('Failed to load stamps data');
        }

        const countryData = await countryResponse.json();
        const cityData = await cityResponse.json();

        // Preload all cover images
        const imageLoadPromises = coverImages.map(imagePath => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = imagePath;
            img.onload = resolve;
            img.onerror = reject;
          });
        });

        await Promise.all(imageLoadPromises);

        setCountryStamps(countryData.country_stamps);
        setCityStamps(cityData.city_stamps);
        setImagesLoaded(true);
      } catch (err) {
        console.error('Error loading resources:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllResources();
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

  // Update loading check
  if (isLoading || !imagesLoaded) {
    return (
      <div className="h-screen-dynamic w-full flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-5">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-purple-100" />
            <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-t-[3px] border-pink-400"
              style={{ animationDirection: 'reverse' }} />
          </div>
          <span className="text-lg font-medium text-gray-700">
            Loading 🌎 📘
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8 p-8 min-h-screen bg-neutral-100" data-testid="flipbook-container">
      <div
        data-testid="wooden-background"
        className="w-full max-w-5xl p-12 rounded-lg relative overflow-hidden"
        style={{
          backgroundImage: 'url("/api/get-assets?type=images&name=booktable.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.3)'
        }}
      >
        <div className="relative">
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
              flippingTime={3000}
              usePortrait={false}
              autoSize={true}
              clickEventForward={false}
              useMouseEvents={true}
              swipeDistance={0}
              showPageCorners={true}
              disableFlipByClick={false}
            >
              <PassportCover position="frontCover" passportDisplayName={passportDisplayName ?? undefined} />
              <PassportCover position="frontInside" />
              {validLocations.map((location, index) => (
                <PassportPage
                  key={`${location.place_country}-${index}`}
                  location={location}
                  // location={location.place_country ? location : undefined}
                  countryStamps={countryStamps}
                  cityStamps={cityStamps}
                  pageNumber={index + 1}
                />
              ))}
              <PassportCover position="backInside" />
              <PassportCover position="backCover" />
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
      </div>
    </div>
  );
};

export default PassportFlipBook;