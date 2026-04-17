'use client';

import type { ReactElement } from 'react';
import { CHROME_STORE_URL } from '@/lib/publicConfig';
import { track } from '@/lib/analytics';
import './ChromeStoreCtaButton.css';

interface ChromeStoreCtaButtonProps {
  /** 'lg' for hero-scale buttons, 'md' for standard header/inline buttons */
  size?: 'lg' | 'md';
  /** 'primary' = accent blue (default), 'ghost' = semi-transparent (footer) */
  variant?: 'primary' | 'ghost';
  className?: string;
  onClick?: () => void;
}

/** Canonical Chrome Web Store CTA button. Handles URL, tracking, and responsive sizing. */
export function ChromeStoreCtaButton({
  size = 'md',
  variant = 'primary',
  className,
  onClick,
}: ChromeStoreCtaButtonProps): ReactElement {
  const classes = [
    'chrome-store-cta-btn',
    size === 'lg' ? 'chrome-store-cta-btn--lg' : null,
    variant === 'ghost' ? 'chrome-store-cta-btn--ghost' : null,
    className ?? null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <a
      href={CHROME_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
      onClick={() => {
        track('chrome_store_link_clicked');
        onClick?.();
      }}
    >
      Add to Chrome -{' '}
      <span>It&apos;s{' '}<strong className="chrome-store-cta-btn-free">Free</strong></span>
    </a>
  );
}
