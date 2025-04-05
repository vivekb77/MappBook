// components/utils/ViewportHandler.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function ViewportHandler() {
  const pathname = usePathname();

  useEffect(() => {
    const updateViewport = () => {
      // Fix for iOS viewport issues
      const viewportMeta = document.querySelector('meta[name=viewport]');
      if (!viewportMeta) {
        // Create viewport meta if it doesn't exist
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0';
        document.head.appendChild(meta);
      } else {
        // Force viewport refresh
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
      }

      // Set the --vh CSS variable to 1% of the viewport height
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };

    // Initial update
    updateViewport();

    // Update on orientation change and resize
    window.addEventListener('orientationchange', updateViewport);
    window.addEventListener('resize', () => {
      // Debounce resize events
      setTimeout(updateViewport, 100);
    });

    return () => {
      window.removeEventListener('orientationchange', updateViewport);
      window.removeEventListener('resize', updateViewport);
    };
  }, [pathname]);

  // Add CSS variable for viewport height
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      :root {
        --vh: 1vh;
      }
      .min-h-screen-dynamic {
        min-height: 100vh; /* Fallback */
        min-height: calc(var(--vh, 1vh) * 100);
      }
      .h-screen-dynamic {
        height: 100vh; /* Fallback */
        height: calc(var(--vh, 1vh) * 100);
      }
    `;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);

  // Add pull-to-refresh prevention
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Prevent touchmove when starting from the top of the page
    const handleTouchStart = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const isAtTop = window.scrollY <= 0;
      
      if (isAtTop) {
        const handleTouchMove = (moveEvent: TouchEvent) => {
          const currentTouchY = moveEvent.touches[0].clientY;
          if (currentTouchY > touchY) {
            moveEvent.preventDefault();
          }
        };
        
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        
        const cleanup = () => {
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', cleanup);
          document.removeEventListener('touchcancel', cleanup);
        };
        
        document.addEventListener('touchend', cleanup, { once: true });
        document.addEventListener('touchcancel', cleanup, { once: true });
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.body.style.overscrollBehavior = 'none';
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.body.style.overscrollBehavior = '';
    };
  }, []);

  return null;
}