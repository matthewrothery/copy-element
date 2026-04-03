'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { track } from '@/lib/analytics';

interface SectionTrackProps {
  section: string;
  children: ReactNode;
  threshold?: number;
}

/**
 * Wraps a page section and fires `feature_section_viewed` once when
 * the section scrolls into view (via IntersectionObserver).
 */
export function SectionTrack({ section, children, threshold = 0.3 }: SectionTrackProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !firedRef.current) {
          firedRef.current = true;
          track('feature_section_viewed', { section });
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [section, threshold]);

  return <div ref={ref}>{children}</div>;
}
