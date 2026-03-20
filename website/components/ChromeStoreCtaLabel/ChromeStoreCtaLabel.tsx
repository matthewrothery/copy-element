import type { ReactElement } from "react";
import "./ChromeStoreCtaLabel.css";

/** Canonical website primary CTA for the Chrome Web Store link. */
export function ChromeStoreCtaLabel(): ReactElement {
  return (
    <span className="chrome-store-cta-label">
      Add to Chrome - It&apos;s{" "}
      <strong className="chrome-store-cta-label-free">Free</strong>
    </span>
  );
}
