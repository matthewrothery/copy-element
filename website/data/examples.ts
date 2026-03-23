export type Example = {
  id: string;
  name: string;
  description: string;
  category: string;
  html: string;
  css: string;
};

export function getExample(id: string): Example | undefined {
  return EXAMPLES.find((e) => e.id === id);
}

export const EXAMPLES: Example[] = [
  {
    id: "primary-button",
    name: "Primary Button",
    description: "Blue primary action button with hover, active, and focus-visible states.",
    category: "Buttons",
    html: `<div class="demo">
  <button class="btn">Get Started</button>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.btn {
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms, transform 100ms;
  font-family: inherit;
  letter-spacing: 0.01em;
}
.btn:hover { background: #2563eb; }
.btn:active { background: #1d4ed8; transform: translateY(1px); }
.btn:focus-visible { outline: 2px solid #3b82f6; outline-offset: 3px; }`,
  },
  {
    id: "ghost-button-group",
    name: "Ghost Button Group",
    description:
      "Button group with ghost and primary variants for form actions like cancel, save draft, and publish.",
    category: "Buttons",
    html: `<div class="demo">
  <div class="btn-group">
    <button class="btn btn-ghost">Cancel</button>
    <button class="btn btn-ghost">Save Draft</button>
    <button class="btn btn-primary">Publish</button>
  </div>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.btn-group {
  display: flex;
  gap: 8px;
  align-items: center;
}
.btn {
  border-radius: 7px;
  padding: 9px 18px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms;
  font-family: inherit;
  line-height: 1.4;
}
.btn-ghost {
  background: transparent;
  color: #374151;
  border: 1px solid #d1d5db;
}
.btn-ghost:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}
.btn-primary {
  background: #3b82f6;
  color: #fff;
  border: 1px solid #3b82f6;
}
.btn-primary:hover { background: #2563eb; border-color: #2563eb; }`,
  },
  {
    id: "feature-card",
    name: "Feature Card",
    description:
      "Feature highlight card with SVG icon, title, and supporting description text.",
    category: "Cards",
    html: `<div class="demo">
  <div class="card">
    <div class="card-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="8" height="8" rx="2" fill="#3b82f6"/>
        <rect x="13" y="3" width="8" height="8" rx="2" fill="#93c5fd"/>
        <rect x="3" y="13" width="8" height="8" rx="2" fill="#93c5fd"/>
        <rect x="13" y="13" width="8" height="8" rx="2" fill="#3b82f6"/>
      </svg>
    </div>
    <h3 class="card-title">Modular Design</h3>
    <p class="card-body">Build complex UIs from small, composable components. Each piece works independently and integrates seamlessly.</p>
  </div>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}
.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 28px;
  max-width: 320px;
  width: 100%;
}
.card-icon {
  width: 48px;
  height: 48px;
  background: #eff6ff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}
.card-body {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
}`,
  },
  {
    id: "pricing-card",
    name: "Pricing Card",
    description:
      "Pricing plan card with plan name, price, feature list, and call-to-action button.",
    category: "Cards",
    html: `<div class="demo">
  <div class="card">
    <div class="card-header">
      <span class="plan-label">Pro</span>
      <div class="plan-price">
        <span class="price">$29</span>
        <span class="period">/month</span>
      </div>
      <p class="plan-desc">For teams that need more power.</p>
    </div>
    <ul class="features">
      <li class="feature">
        <svg class="check" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Unlimited captures
      </li>
      <li class="feature">
        <svg class="check" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Export to React &amp; Vue
      </li>
      <li class="feature">
        <svg class="check" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        AI-powered cleanup
      </li>
      <li class="feature">
        <svg class="check" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Priority support
      </li>
    </ul>
    <button class="cta">Get started</button>
  </div>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}
.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 28px;
  max-width: 280px;
  width: 100%;
}
.card-header { margin-bottom: 20px; }
.plan-label {
  font-size: 12px;
  font-weight: 600;
  color: #3b82f6;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: block;
  margin-bottom: 8px;
}
.plan-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 6px;
}
.price {
  font-size: 36px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}
.period { font-size: 14px; color: #6b7280; }
.plan-desc { font-size: 13px; color: #6b7280; }
.features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.feature {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
}
.check { flex-shrink: 0; }
.cta {
  width: 100%;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 11px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 150ms;
}
.cta:hover { background: #2563eb; }`,
  },
  {
    id: "status-badge",
    name: "Status Badge",
    description:
      "Inline status badge components with color-coded variants for Active, Pending, and Archived states.",
    category: "Labels",
    html: `<div class="demo">
  <span class="badge badge-active">Active</span>
  <span class="badge badge-pending">Pending</span>
  <span class="badge badge-archived">Archived</span>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.demo {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
}
.badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.badge-active { background: #dcfce7; color: #16a34a; }
.badge-active::before { background: #22c55e; }
.badge-pending { background: #fef9c3; color: #a16207; }
.badge-pending::before { background: #eab308; }
.badge-archived { background: #f3f4f6; color: #6b7280; }
.badge-archived::before { background: #9ca3af; }`,
  },
  {
    id: "top-nav-bar",
    name: "Top Nav Bar",
    description:
      "Responsive top navigation bar with logo, navigation links, and a primary CTA button.",
    category: "Navigation",
    html: `<nav class="nav">
  <div class="nav-inner">
    <a class="nav-logo" href="#">
      <div class="logo-mark"></div>
      Acme
    </a>
    <div class="nav-links">
      <a href="#" class="nav-link">Product</a>
      <a href="#" class="nav-link">Pricing</a>
      <a href="#" class="nav-link">Docs</a>
      <a href="#" class="nav-link">Blog</a>
    </div>
    <a href="#" class="nav-cta">Get Started</a>
  </div>
</nav>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f8fafc;
  min-height: 100vh;
}
.nav {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}
.nav-inner {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 32px;
}
.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  text-decoration: none;
  flex-shrink: 0;
}
.logo-mark {
  width: 24px;
  height: 24px;
  background: #3b82f6;
  border-radius: 6px;
}
.nav-links {
  display: flex;
  gap: 4px;
  flex: 1;
}
.nav-link {
  text-decoration: none;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 6px;
  transition: color 150ms, background 150ms;
}
.nav-link:hover { color: #111827; background: #f3f4f6; }
.nav-cta {
  text-decoration: none;
  background: #3b82f6;
  color: #fff;
  border-radius: 7px;
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
  transition: background 150ms;
}
.nav-cta:hover { background: #2563eb; }`,
  },
  {
    id: "email-input-field",
    name: "Email Input Field",
    description:
      "Email input field with label, placeholder text, focus ring, and subscribe button.",
    category: "Forms",
    html: `<div class="demo">
  <form class="form" onsubmit="return false">
    <label class="label" for="email">Email address</label>
    <div class="input-row">
      <input
        class="input"
        id="email"
        type="email"
        placeholder="you@example.com"
        autocomplete="off"
      />
      <button class="btn" type="submit">Subscribe</button>
    </div>
    <p class="hint">No spam. Unsubscribe anytime.</p>
  </form>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 380px;
}
.label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}
.input-row { display: flex; gap: 8px; }
.input {
  flex: 1;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #111827;
  background: #fff;
  transition: border-color 150ms, box-shadow 150ms;
  outline: none;
}
.input::placeholder { color: #9ca3af; }
.input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
.btn {
  height: 40px;
  padding: 0 16px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 150ms;
  white-space: nowrap;
}
.btn:hover { background: #2563eb; }
.hint { font-size: 12px; color: #9ca3af; }`,
  },
  {
    id: "hero-section",
    name: "Hero Section",
    description:
      "Hero section with headline, subtitle, dual CTA buttons, and a social proof indicator.",
    category: "Hero",
    html: `<section class="hero">
  <div class="hero-inner">
    <span class="eyebrow">Now in public beta</span>
    <h1 class="headline">Build UI faster<br>than ever before</h1>
    <p class="subtitle">Capture any element from any website and get clean, ready-to-use HTML and CSS in seconds.</p>
    <div class="cta-row">
      <a href="#" class="btn btn-primary">Get Started Free</a>
      <a href="#" class="btn btn-ghost">See examples</a>
    </div>
    <p class="social">Trusted by 2,400+ developers</p>
  </div>
</section>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.hero { width: 100%; }
.hero-inner {
  max-width: 600px;
  margin: 0 auto;
  padding: 48px 32px;
  text-align: center;
}
.eyebrow {
  display: inline-block;
  background: #eff6ff;
  color: #3b82f6;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 999px;
  margin-bottom: 20px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.headline {
  font-size: 40px;
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}
.subtitle {
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
  max-width: 420px;
  margin: 0 auto 28px;
}
.cta-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.btn {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  border-radius: 8px;
  padding: 11px 22px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  transition: all 150ms;
  cursor: pointer;
  border: none;
}
.btn-primary { background: #3b82f6; color: #fff; }
.btn-primary:hover { background: #2563eb; }
.btn-ghost {
  background: transparent;
  color: #374151;
  border: 1px solid #d1d5db;
}
.btn-ghost:hover { background: #f9fafb; }
.social { font-size: 12px; color: #9ca3af; }`,
  },
];
