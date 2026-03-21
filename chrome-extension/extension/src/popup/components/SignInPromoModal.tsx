import { createPortal } from "react-dom";

interface SignInPromoModalProps {
  onSignIn: () => void;
  onClose: () => void;
}

export function SignInPromoModal({ onSignIn, onClose }: SignInPromoModalProps): React.JSX.Element {
  const content = (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-in-promo-title"
    >
      <div className="modal sign-in-promo-modal">
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="sign-in-promo-graphic" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="12" fill="#EFF6FF" />
            <rect x="10" y="14" width="28" height="20" rx="4" stroke="#3b82f6" strokeWidth="2" />
            <path d="M16 22h16M16 27h10" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h2 id="sign-in-promo-title" className="sign-in-promo-title">
          Unlock the full workflow
        </h2>
        <ul className="sign-in-promo-benefits">
          <li>Copy rich AI prompts for any captured element</li>
          <li>Unlimited library access across devices</li>
          <li>Use with Cursor, Claude, and other AI tools</li>
        </ul>
        <button
          type="button"
          className="btn-primary sign-in-promo-cta"
          onClick={onSignIn}
        >
          Create free account
        </button>
        <button
          type="button"
          className="sign-in-promo-dismiss"
          onClick={onClose}
        >
          Not now
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
