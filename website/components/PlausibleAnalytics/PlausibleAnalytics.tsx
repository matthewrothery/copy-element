'use client';

import { useEffect } from 'react';

function resolvePlausibleDomain(): string | null {
  const explicit = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();
  if (explicit) return explicit;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    try {
      return new URL(siteUrl).hostname;
    } catch {
      return null;
    }
  }

  return 'elementarmory.com';
}

/**
 * Initializes Plausible once on the client. Domain matches Plausible site settings.
 */
export function PlausibleAnalytics(): null {
  useEffect(() => {
    const domain = resolvePlausibleDomain();
    if (!domain) return;

    const endpoint = process.env.NEXT_PUBLIC_PLAUSIBLE_ENDPOINT?.trim();

    void import('@plausible-analytics/tracker').then(({ init }) => {
      init({
        domain,
        ...(endpoint ? { endpoint } : {}),
      });
    });
  }, []);

  return null;
}
