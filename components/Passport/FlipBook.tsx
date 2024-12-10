import React from 'react';
import HTMLFlipBook from 'react-pageflip';

interface Location {
  place_name: string;
  place_country: string;
}

interface VisaStamp {
  country: string;
  city: string;
  svgCode: string;
}

interface PassportPageProps {
  location?: Location;
  pageNumber: number;
  isFirst?: boolean;
  isLast?: boolean;
  visaStamps: VisaStamp[];
}

interface PassportFlipBookProps {
  locations: Location[];
}

const SVGStamp: React.FC<{ svgString: string }> = ({ svgString }) => {
  return (
    <div className="w-44 h-44">
      <div dangerouslySetInnerHTML={{
        __html: svgString.replace('<svg', '<svg class="w-full h-full"')
      }} />
    </div>
  );
};


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
  ({ location, visaStamps }, ref) => {
    if (!location) return null;

    const matchingStamp = visaStamps.find(
      stamp => stamp.country.toLowerCase() === location.place_country.toLowerCase()
    );

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
          <div className="flex flex-col items-center justify-center h-full">
            {matchingStamp ? (
              <div className="transform -rotate-12 relative">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    backgroundColor: 'rgba(139, 115, 85, 0.1)',
                    filter: 'blur(10px)',
                  }}
                />
                <div className="w-64 h-64 relative">
                  <div dangerouslySetInnerHTML={{
                    __html: matchingStamp.svgCode.replace('<svg', '<svg class="w-full h-full"')
                  }} />
                </div>
              </div>
            ) : (
              <div
                className="text-[#463E33] italic font-serif"
                style={{ fontFamily: 'Garamond, serif' }}
              >
                Future adventures await...
              </div>
            )}

            <div
              className="mt-8 text-center"
              style={{ fontFamily: 'Garamond, serif' }}
            >
              <h3 className="font-bold text-[#463E33] mb-2 text-xl">{location.place_name}</h3>
              <p className="text-sm text-[#6B5B4B] italic">{location.place_country}</p>
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
    totalPages: locations.length + 4,
    isAutoFlipping: false
  });

  const [visaStamps, setVisaStamps] = React.useState<VisaStamp[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const flipBookRef = React.useRef<any>(null);
  const autoFlipIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const loadStamps = async () => {
      try {
        const response = await fetch('/visas.json');
        if (!response.ok) throw new Error('Failed to load stamps data');
        const data = await response.json();
        setVisaStamps(data.stamps);
      } catch (err) {
        console.error('Error loading stamps:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStamps();
  }, []);

  // Auto-flip functionality
  const startAutoFlip = () => {
    setPageState(prev => ({ ...prev, isAutoFlipping: true }));

    const flipNextPage = () => {
      if (flipBookRef.current?.pageFlip()) {
        const current = flipBookRef.current.pageFlip().getCurrentPageIndex();
        if (current >= pageState.totalPages - 1) {
          // Reset to start when reaching the end
          flipBookRef.current.pageFlip().flip(0);
          stopAutoFlip();
        } else {
          flipBookRef.current.pageFlip().flipNext();
          setTimeout(flipNextPage, 3000); // Adjust timing as needed
        }
      }
    };

    setTimeout(flipNextPage, 1000); // Initial delay
  };

  const stopAutoFlip = () => {
    if (autoFlipIntervalRef.current) {
      clearInterval(autoFlipIntervalRef.current);
      autoFlipIntervalRef.current = null;
    }
    setPageState(prev => ({ ...prev, isAutoFlipping: false }));
  };

  // Cleanup interval on unmount
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

  const containerWidth = 1080;
  const containerHeight = 1920;
  const aspectRatio = 1.77; // Instagram aspect ratio (1920/1080)

  const bookWidth = containerWidth * 0.9; // 90% of container width
  const bookHeight = bookWidth * aspectRatio; // maintain aspect ratio

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
      </div>
    );
  }


  return (
    <div
      data-testid="flipbook-container"
      className="relative"
      style={{
        width: '1080px',
        height: '1920px',
        overflow: 'hidden',
        backgroundColor: '#F5E6D3' // Match your design
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
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
          style={{
            borderRadius: '12px',
          }}
        >
          <PassportCover />
          {locations.map((location, index) => (
            <PassportPage
              key={`${location.place_country}-${index}`}
              location={location}
              visaStamps={visaStamps}
              pageNumber={0}
            />
          ))}
          <PassportCover />
        </HTMLFlipBook>

        {/* Position the button absolutely over the book */}
        <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2">
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