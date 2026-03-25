import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";
import "@/styles/policy.css";

export const dynamic = "force-static";

export const metadata = {
  title: "Cookie Policy – Element Armory",
  description: "How Element Armory uses cookies and similar technologies.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main className="content-page">
        <PageHero
          title="Cookie Policy"
          subtitle="How Element Armory uses cookies and similar technologies."
        />

        <div className="policy-content">
          <section>
            <h2>Introduction</h2>
            <p>
              This Cookie Policy explains how Element Armory (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) uses cookies and similar technologies when you visit our website or use our services. This policy should be read alongside our <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms of Service</Link>.
            </p>
            <p>
              By using our website, you consent to the use of cookies in accordance with this Cookie Policy. If you do not accept the use of cookies, you can disable them, though this may affect your experience.
            </p>
          </section>

          <section>
            <h2>What are Cookies?</h2>
            <p>
              Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners. Persistent cookies remain on your device when you go offline, while session cookies are deleted when you close your browser.
            </p>
          </section>

          <section>
            <h2>How We Use Cookies</h2>
            <p>We use cookies for the following purposes:</p>
            <ul>
              <li><strong>Essential Cookies:</strong> Necessary for the website to function properly. They enable core functionality such as authentication and security. You cannot opt out of these cookies.</li>
              <li><strong>Performance / Analytics Cookies:</strong> Allow us to measure and improve the performance of our site by counting visits and understanding how visitors navigate. All data is aggregated and anonymized.</li>
              <li><strong>Functionality Cookies:</strong> Enable enhanced functionality and personalization, such as remembering your preferences and settings.</li>
            </ul>
          </section>

          <section>
            <h2>Cookies We Use</h2>
            <ul>
              <li>
                <strong>ea_session</strong> (Essential) - Maintains your session and authentication status. Duration: session.
              </li>
              <li>
                <strong>ea_preferences</strong> (Functionality) - Stores your preferences and settings. Duration: 1 year.
              </li>
              <li>
                <strong>_ga, _gid</strong> (Analytics) - Google Analytics cookies used to distinguish users and sessions for aggregate reporting. Duration: 2 years / 24 hours.
              </li>
            </ul>
          </section>

          <section>
            <h2>Third-Party Cookies</h2>
            <p>
              Some cookies are placed by third-party services we use. These include:
            </p>
            <ul>
              <li><strong>Google Analytics</strong> - Helps us understand how visitors use our site. Data is aggregated and anonymized.</li>
              <li><strong>Stripe</strong> - Our payment processor may set cookies when you access billing pages to prevent fraud and maintain session integrity.</li>
            </ul>
            <p>
              We do not control cookies set by third parties. You can control these through your browser settings or opt-out tools provided by those services.
            </p>
          </section>

          <section>
            <h2>Managing Cookies</h2>
            <p>
              Most web browsers allow you to control cookies through their settings. You can usually find these in the &ldquo;Options&rdquo; or &ldquo;Preferences&rdquo; menu of your browser. Helpful links:
            </p>
            <ul>
              <li>
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
                  Google Chrome
                </a>
              </li>
              <li>
                <a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer">
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer">
                  Apple Safari
                </a>
              </li>
              <li>
                <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">
                  Microsoft Edge
                </a>
              </li>
            </ul>
            <p>
              Please note that blocking all cookies may affect the functionality of our website.
            </p>
          </section>

          <section>
            <h2>Changes to this Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our business practices. Any changes will be posted on this page.
            </p>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>
              If you have questions about our use of cookies, please contact us at:{" "}
              <a href="mailto:support@elementarmory.com">support@elementarmory.com</a>
            </p>
          </section>

          <p className="policy-updated">
            <strong>Last updated:</strong> March 2026
          </p>
        </div>

        <Footer />
      </main>
    </>
  );
}
