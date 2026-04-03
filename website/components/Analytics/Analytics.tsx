'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track, trackPageView } from '@/lib/analytics';

/**
 * Drop into root layout to auto-track page views on mount and soft navigations.
 * Also fires page_duration when navigating away from a page, recording time spent.
 */
export function Analytics(): null {
  const pathname = usePathname();
  const pageStartRef = useRef<number>(Date.now());
  const prevPathnameRef = useRef<string>(pathname);

  useEffect(() => {
    const prevPathname = prevPathnameRef.current;
    const duration_ms = Date.now() - pageStartRef.current;

    // On pathname change (after first mount), fire duration for the previous page
    if (prevPathname !== pathname) {
      track('page_duration', { url: prevPathname, duration_ms });
    }

    pageStartRef.current = Date.now();
    prevPathnameRef.current = pathname;
    trackPageView();

    // On unmount (tab close / hard navigation), fire duration for current page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        track('page_duration', {
          url: pathname,
          duration_ms: Date.now() - pageStartRef.current,
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname]);

  return null;
}
