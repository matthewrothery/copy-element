import Link from "next/link";
import { StructuredData } from "@/components/StructuredData";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";
import "@/styles/policy.css";

export const dynamic = "force-static";

import { buildPageMetadata, webPageSchema } from "@/lib/seo";

const TERMS_TITLE = "Element Armory Terms of Service";
const TERMS_DESCRIPTION =
  "Read the terms and conditions that govern your use of Element Armory, the website, Chrome extension, and related services.";

export const metadata = buildPageMetadata({
  title: TERMS_TITLE,
  description: TERMS_DESCRIPTION,
  path: "/terms",
});

export default function TermsPage(): React.ReactElement {
  return (
    <>
      <StructuredData
        data={webPageSchema({
          name: TERMS_TITLE,
          description: TERMS_DESCRIPTION,
          path: "/terms",
        })}
      />
      <Header />
      <main className="content-page">
        <PageHero
          title="Terms of Service"
          subtitle="The terms and conditions governing your use of Element Armory."
        />

        <div className="policy-content">
          <section>
            <h2>Terms and Conditions of Use</h2>
            <p>
              <strong>Please read these Terms and Conditions of Use carefully before using Element Armory.</strong>
            </p>
            <p>
              Welcome to Element Armory. By continuing to use this website or the Element Armory browser extension, you agree to comply with and be bound by the following terms and conditions of use, which together with our Privacy Policy govern Element Armory&apos;s relationship with you.
            </p>
            <p>
              For the purposes of these terms, &ldquo;Us&rdquo;, &ldquo;Our&rdquo;, and &ldquo;We&rdquo; refers to Element Armory, and &ldquo;You&rdquo; and &ldquo;Your&rdquo; refers to you, the user, visitor, or person using our website or extension.
            </p>
          </section>

          <section>
            <h2>Amendment of Terms</h2>
            <p>
              We reserve the right to change, modify, add, or remove portions of these terms at any time. We will provide notice of material changes through one or more of the following methods:
            </p>
            <ul>
              <li>Email notification to your registered email address</li>
              <li>Prominent notice on our website</li>
              <li>In-app notification when you next use our services</li>
            </ul>
            <p>
              For significant changes, we will provide at least 30 days&apos; notice before the changes take effect. Your continued use of our services after the effective date of any changes constitutes acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using our services.
            </p>
          </section>

          <section>
            <h2>Description of Service</h2>
            <p>
              Element Armory is a browser extension and web platform that allows you to inspect, capture, and export UI elements - including HTML, CSS, and related code - from websites you visit. The captured output is intended to help developers understand, reference, and rebuild UI components.
            </p>
            <p>
              Element Armory may, in the future, update current services and/or features or offer new services and/or features. Such updated or new features shall be subject to the terms and conditions of this Agreement.
            </p>
            <p>
              Access to Element Armory is permitted on a temporary basis. We reserve the right to modify or discontinue the service at any time without notice.
            </p>
          </section>

          <section>
            <h2>Captured Content and Third-Party Rights</h2>
            <p>
              Element Armory allows you to capture HTML, CSS, and other UI elements from third-party websites. You are solely responsible for the legality of your use of any captured content.
            </p>
            <p>
              Element Armory makes no representations as to the intellectual property status of captured elements. The presence of a capture tool does not imply that captured content is free to use, copy, or redistribute. Many UI elements may be protected by copyright, trademark, or other intellectual property rights belonging to their respective owners.
            </p>
            <p>
              We are not responsible for any infringement of third-party copyrights, trademarks, design rights, or other intellectual property rights arising from your capture, use, modification, or redistribution of elements from other websites. You must independently assess the rights status of any captured content and obtain any required permissions before using it in your own products or distributing it to others.
            </p>
            <p>
              Element Armory expressly disclaims all liability for any claims, damages, or losses arising from your use of captured content.
            </p>
          </section>

          <section>
            <h2>Service Availability and Maintenance</h2>
            <p>
              While we strive to provide consistent and reliable service, we do not guarantee that our services will be available at all times. Our services may be temporarily unavailable due to:
            </p>
            <ul>
              <li>Scheduled maintenance</li>
              <li>Emergency repairs</li>
              <li>System upgrades</li>
              <li>Technical difficulties</li>
              <li>Circumstances beyond our control</li>
            </ul>
            <p>
              We will make reasonable efforts to provide advance notice of scheduled maintenance but are not obligated to do so. We will not be liable for any losses or damages arising from service interruptions.
            </p>
          </section>

          <section>
            <h2>Intellectual Property and Content</h2>
            <p>
              You retain ownership of any content you create or submit to our services. However, by submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute it solely for the purpose of providing our services.
            </p>
            <p>
              You represent and warrant that you have the right to grant this license and that your content does not infringe any third-party rights. You are solely responsible for your content and any consequences of posting or publishing it.
            </p>
          </section>

          <section>
            <h2>User Obligations and Acceptable Use</h2>
            <p>
              You must be over 16 years of age to use this website or purchase any services. You represent and warrant that your use of our services will be in strict accordance with these Terms. In particular, you agree not to use our services:
            </p>
            <ul>
              <li>In any unlawful manner or for any unlawful purpose</li>
              <li>To act fraudulently or maliciously, including inserting malicious code or viruses</li>
              <li>To infringe our intellectual property rights or those of any third party</li>
              <li>To harass, threaten, alarm, or annoy any other person</li>
              <li>To mislead or deceive any person or impersonate any entity</li>
              <li>In a way that could damage, disable, or compromise our systems or security</li>
              <li>To collect or harvest any information from our systems without authorization</li>
            </ul>
            <p>
              In the event that you breach these obligations, we may terminate your access to our services immediately.
            </p>
          </section>

          <section>
            <h2>Subscription and Payment Terms</h2>
            <p>
              Element Armory offers both free and paid subscription plans. By subscribing to a paid plan, you agree to pay all fees and charges associated with your subscription.
            </p>

            <h3>Payment and Billing</h3>
            <p>
              Subscription fees are charged in advance on a monthly or annual basis. Payment will be charged to your designated payment method upon subscription. You authorize us to charge your payment method for all subscription fees.
            </p>

            <h3>Automatic Renewal</h3>
            <p>
              Your subscription will automatically renew at the end of each subscription period unless you cancel prior to the renewal date. You can cancel at any time through your account settings.
            </p>

            <h3>Price Changes</h3>
            <p>
              We may change subscription prices at any time. Price changes will take effect at the start of the next subscription period. We will notify you at least 30 days in advance.
            </p>

            <h3>Refunds and Cancellations</h3>
            <p>
              We offer a 30-day money-back guarantee for first-time subscribers. If you cancel within 30 days of your initial subscription, you will receive a full refund. After this period, payments are non-refundable, but you may cancel at any time to prevent future charges.
            </p>
          </section>

          <section>
            <h2>Account Termination</h2>
            <p>
              You may terminate your account at any time by canceling your subscription and discontinuing use of our services.
            </p>

            <h3>Termination by Element Armory</h3>
            <p>
              We may terminate or suspend your account at our sole discretion, without prior notice or liability, for any reason, including but not limited to:
            </p>
            <ul>
              <li>Breach of these Terms</li>
              <li>Fraudulent or illegal activity</li>
              <li>Non-payment of fees</li>
              <li>Prolonged inactivity</li>
              <li>Request by law enforcement or other government agencies</li>
            </ul>

            <h3>Effect of Termination</h3>
            <p>
              Upon termination, we may immediately revoke your access to the services and delete or remove your data. We are not obligated to retain your data after termination, though we may retain certain information as required by law.
            </p>
          </section>

          <section>
            <h2>Links to Other Websites</h2>
            <p>
              Element Armory may from time to time provide links to other websites for your convenience. This does not imply sponsorship, endorsement, or arrangement between Element Armory and the owners of those websites. Element Armory takes no responsibility for any content found on linked websites.
            </p>
          </section>

          <section>
            <h2>Your Privacy and Data Processing</h2>
            <p>
              We are committed to protecting your privacy. We use information we collect about you to provide and improve our services. Please read our <Link href="/privacy">Privacy Policy</Link> carefully.
            </p>
            <p>
              By using our services, you consent to the collection, use, and processing of your personal data as described in our Privacy Policy. You have the right to access, correct, delete, or restrict the processing of your personal data.
            </p>
          </section>

          <section>
            <h2>Third Parties</h2>
            <p>
              We do not and will not sell or deal in personal or customer information. We may use aggregated, anonymized data to improve our website and services but not for any other use.
            </p>
          </section>

          <section>
            <h2>Disclosure of Information</h2>
            <p>
              Element Armory may be required, in certain circumstances, to disclose information in good faith: by law or by any court; to enforce the terms of any customer agreements; or to protect the rights, property, or safety of our customers or third parties.
            </p>
          </section>

          <section>
            <h2>Limitation of Liability</h2>
            <p>
              Element Armory is not legally responsible for any loss or damage you might suffer related to your use of the website or extension, whether from errors or omissions in our documents or information, any goods or services we may offer, or from any other use. This includes your use or reliance on any third-party content, links, or captured elements.
            </p>
            <p>
              Your use of, or reliance on, any information or materials on this website is entirely at your own risk. It shall be your own responsibility to ensure that any products, services, or information available through this website meet your specific requirements.
            </p>
          </section>

          <section>
            <h2>Disclaimer</h2>
            <p>
              To the fullest extent permitted by law, Element Armory absolutely disclaims all warranties, expressed or implied, including but not limited to implied warranties of merchantability and fitness for any particular purpose. Element Armory gives no warranty that the service will be free of errors, or that defects will be corrected, or that our website or servers are free of viruses or any other harmful components.
            </p>
            <p>
              Whilst we endeavour to have accurate and up-to-date information on our website, we do not warrant or make any representations regarding the use or result of the use of any document, product, service, or information as to their correctness, suitability, accuracy, reliability, or otherwise.
            </p>
          </section>

          <section>
            <h2>Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Element Armory, its officers, directors, employees, agents, and contractors from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including attorney&apos;s fees) arising from:
            </p>
            <ul>
              <li>Your use of our services</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights, including copyright, trademark, property, or privacy rights</li>
              <li>Your use of captured content from third-party websites</li>
              <li>Any content you create, upload, or otherwise make available through our services</li>
            </ul>
            <p>
              This indemnification obligation will survive the termination of these Terms and your use of our services.
            </p>
          </section>

          <section>
            <h2>Whole Agreement</h2>
            <p>
              These terms and conditions represent the whole agreement between you and Element Armory concerning your use and access to our website and services. No other term is to be included in this agreement except where it is required to be included by any applicable legislation.
            </p>
          </section>

          <section>
            <h2>Exclusion of Unenforceable Terms</h2>
            <p>
              Where any clause or term above would by any applicable statute be illegal, void, or unenforceable in any jurisdiction, such a clause shall not apply in that jurisdiction. The remaining terms shall continue to be fully enforceable in all other jurisdictions.
            </p>
          </section>

          <section>
            <h2>Jurisdiction and Applicable Law</h2>
            <p>
              This Agreement is governed by applicable law in the jurisdiction where you reside, to the extent required by law. Any disputes arising from these Terms will be resolved in accordance with the laws applicable to your jurisdiction.
            </p>
          </section>

          <section>
            <h2>Contact Information</h2>
            <p>
              If you have questions about these Terms of Service, please contact us at:{" "}
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
