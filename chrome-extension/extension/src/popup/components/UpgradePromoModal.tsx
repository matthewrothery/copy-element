import { createPortal } from "react-dom";

interface UpgradePromoModalProps {
  onUpgrade: () => void;
  onClose: () => void;
}

export function UpgradePromoModal({ onUpgrade, onClose }: UpgradePromoModalProps): React.JSX.Element {
  const content = (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-promo-title"
    >
      <div className="modal upgrade-promo-modal">
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="upgrade-promo-graphic" aria-hidden="true">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="56" height="56" rx="14" fill="#EFF6FF" />
            <rect x="8" y="16" width="24" height="18" rx="3" stroke="#3b82f6" strokeWidth="2" />
            <rect x="24" y="22" width="24" height="18" rx="3" fill="#EFF6FF" stroke="#3b82f6" strokeWidth="2" />
            <path d="M30 29h12M30 33h8" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
            <circle cx="42" cy="16" r="5" fill="#3b82f6" />
            <path d="M39.5 16l1.5 1.5 3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 id="upgrade-promo-title" className="upgrade-promo-title">
          Unlock the full Element Armory
        </h2>
        <ul className="upgrade-promo-benefits">
          <li>Advanced AI prompts with full HTML, CSS context</li>
          <li>Connect AI tools directly via MCP</li>
          <li>Convert to React, Tailwind, and more</li>
          <li>Unlimited library with cross-device sync</li>
        </ul>
        <button
          type="button"
          className="btn-primary upgrade-promo-cta"
          onClick={onUpgrade}
        >
          Upgrade to Pro
        </button>
        <button
          type="button"
          className="upgrade-promo-dismiss"
          onClick={onClose}
        >
          Not now
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
