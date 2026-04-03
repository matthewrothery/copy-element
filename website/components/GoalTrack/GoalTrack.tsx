'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

interface GoalTrackProps {
  goal: string;
  properties?: Record<string, unknown>;
}

/**
 * Drop into any page to fire a goal event once on mount.
 * Renders nothing.
 */
export function GoalTrack({ goal, properties }: GoalTrackProps): null {
  useEffect(() => {
    track(goal, properties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
