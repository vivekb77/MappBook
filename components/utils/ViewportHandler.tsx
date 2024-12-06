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

      // Additional fix for iOS Safari
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
      .min-h-full {
        min-height: calc(var(--vh) * 100);
      }
    `;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);

  return null;
}