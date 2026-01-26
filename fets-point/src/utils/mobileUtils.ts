/**
 * Mobile Responsive Utilities
 * Provides hooks and utilities for mobile-optimized viewing
 */

import { useEffect, useState } from 'react';

// Detect if user is on mobile device
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Detect screen size category
export function useScreenSize(): 'mobile' | 'tablet' | 'desktop' {
  const [size, setSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      if (width < 768) setSize('mobile');
      else if (width < 1024) setSize('tablet');
      else setSize('desktop');
    };
    
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  return size;
}

// Touch-friendly click handler
export function useTouchFriendly() {
  return {
    className: 'touch-manipulation select-none active:scale-95 transition-transform',
    style: { WebkitTapHighlightColor: 'transparent' }
  };
}

// Prevent pull-to-refresh on specific elements
export function preventPullToRefresh(element: HTMLElement | null) {
  if (!element) return;
  
  let startY = 0;
  
  element.addEventListener('touchstart', (e) => {
    startY = e.touches[0].pageY;
  }, { passive: false });
  
  element.addEventListener('touchmove', (e) => {
    const y = e.touches[0].pageY;
    if (element.scrollTop === 0 && y > startY) {
      e.preventDefault();
    }
  }, { passive: false });
}
