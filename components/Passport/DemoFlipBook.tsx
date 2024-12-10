import React, { useState, useEffect, useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';

interface PageCoverProps {
  children: React.ReactNode;
}

interface PageProps {
  number: number;
  children: React.ReactNode;
}

const PageCover = React.forwardRef<HTMLDivElement, PageCoverProps>((props, ref) => (
  <div className="relative h-full w-full bg-neutral-100 rounded shadow-lg" ref={ref} data-density="hard">
    <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
      <h2 className="text-3xl font-bold text-neutral-800">{props.children}</h2>
    </div>
  </div>
));

const Page = React.forwardRef<HTMLDivElement, PageProps>((props, ref) => (
  <div className="relative h-full w-full bg-white rounded shadow-lg" ref={ref}>
    <div className="absolute inset-0 p-8">
      <h2 className="text-xl font-semibold mb-4 text-neutral-800">Page Header - {props.number}</h2>
      <div className="aspect-video w-full bg-neutral-200 mb-4 rounded"></div>
      <div className="text-neutral-600 text-sm leading-relaxed">
        {props.children}
      </div>
      <div className="absolute bottom-4 right-8 text-sm text-neutral-400">
        {props.number + 1}
      </div>
    </div>
  </div>
));

// Define the PageFlip interface for the methods we'll use
interface PageFlip {
  flipNext(): void;
  flipPrev(): void;
  getPageCount(): number;
}

const DemoFlipBook = () => {
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [orientation, setOrientation] = useState('landscape');
  const [state, setState] = useState('read');
  const flipBook = useRef<PageFlip | null>(null);

  useEffect(() => {
    // Set total pages once the book is mounted
    if (flipBook.current) {
      setTotalPages(flipBook.current.getPageCount());
    }
  }, []);

  const nextPage = () => {
    if (flipBook.current) {
      flipBook.current.flipNext();
    }
  };

  const prevPage = () => {
    if (flipBook.current) {
      flipBook.current.flipPrev();
    }
  };

  const onPage = (e: { data: number }) => {
    setPage(e.data);
  };

  const onChangeOrientation = (e: { data: string }) => {
    setOrientation(e.data);
  };

  const onChangeState = (e: { data: string }) => {
    setState(e.data);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <div className="w-full max-w-4xl">
        <HTMLFlipBook
          width={550}
          height={733}
          size="stretch"
          minWidth={315}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1533}
          maxShadowOpacity={0.0}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={onPage}
          onChangeOrientation={onChangeOrientation}
          onChangeState={onChangeState}
          className="demo-book"
          ref={(el) => {
            // @ts-ignore - HTMLFlipBook's ref type is not properly exposed
            flipBook.current = el?.pageFlip() || null;
          }}
        >
          <PageCover>BOOK TITLE</PageCover>
          <Page number={1}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Page>
          <Page number={2}>
            Suspendisse rutrum, augue ac sollicitudin mollis.
          </Page>
          <Page number={3}>
            Eros velit viverra metus, a venenatis tellus.
          </Page>
          <Page number={4}>
            Aliquam ac nulla rhoncus, accumsan eros sed.
          </Page>
          <PageCover>THE END</PageCover>
        </HTMLFlipBook>
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

export default DemoFlipBook;