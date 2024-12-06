
'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function ViewportHandler() {
  const pathname = usePathname();

  useEffect(() => {
    // Force viewport meta tag update
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      // Store original content with type assertion
      const originalContent = viewport.getAttribute('content') || '';
      
      // Temporarily modify and restore to force update
      viewport.setAttribute('content', `${originalContent},x=0`);
      requestAnimationFrame(() => {
        viewport.setAttribute('content', originalContent);
      });
    }
  }, [pathname]); // Re-run when pathname changes

  return null;
}