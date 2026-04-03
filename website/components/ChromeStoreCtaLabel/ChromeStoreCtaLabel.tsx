'use client';

import type { ReactElement } from "react";
import { track } from "@/lib/analytics";
import "./ChromeStoreCtaLabel.css";

/** Canonical website primary CTA for the Chrome Web Store link. */
export function ChromeStoreCtaLabel(): ReactElement {
  return (
    <span
      className="chrome-store-cta-label"
      onClick={() => track('chrome_store_link_clicked')}
    >
      Add to Chrome - It&apos;s{" "}
      <strong className="chrome-store-cta-label-free">Free</strong>
    </span>
  );
}
