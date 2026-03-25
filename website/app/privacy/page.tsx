import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";
import "@/styles/policy.css";

export const dynamic = "force-static";

export const metadata = {
  title: "Privacy Policy – Element Armory",
  description: "How Element Armory collects, uses, and protects your personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main className="content-page">
        <PageHero
          title="Privacy Policy"
          subtitle="How Element Armory collects, uses, and protects your personal information."
        />

        <div className="policy-content">
          <section>
            <h2>Introduction</h2>
            <p>
              Element Armory (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to protecting and respecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our browser extension and web platform.
            </p>
            <p>
              This Privacy Policy should be read alongside our <Link href="/cookies">Cookie Policy</Link> and <Link href="/terms">Terms of Service</Link>.
            </p>
          </section>

          <section>
            <h2>Information We Collect</h2>
            <p>We collect the following types of information:</p>

            <h3>Personal Information</h3>
            <ul>
              <li><strong>Account Information:</strong> When you register for an account, we collect your email address and password.</li>
              <li><strong>Billing Information:</strong> For paid subscriptions, we collect payment details, billing address, and transaction history via our payment processor (Stripe). We do not store card numbers on our servers.</li>
            </ul>

            <h3>Usage Information</h3>
            <ul>
              <li><strong>Extension Activity:</strong> Aggregated, anonymized data about feature usage (e.g., how often capture tools are used) to help us improve the product. We do not store the HTML or CSS content you capture.</li>
              <li><strong>Analytics Data:</strong> Information about how you interact with our website, including pages visited and features used.</li>
            </ul>

            <h3>Technical Information</h3>
            <ul>
              <li><strong>Device Information:</strong> Device type, operating system, and browser type.</li>
              <li><strong>Log Data:</strong> IP address, browser details, access times, and pages viewed.</li>
              <li><strong>Cookies and Similar Technologies:</strong> Information collected through cookies. See our <Link href="/cookies">Cookie Policy</Link> for details.</li>
            </ul>
          </section>

          <section>
            <h2>How We Use Your Information</h2>
            <p>We use your information for the following purposes:</p>
            <ul>
              <li><strong>Providing our Services:</strong> To operate and maintain the extension and platform, manage your account, and deliver the services you request.</li>
              <li><strong>Improving our Services:</strong> To understand how the extension is used, develop new features, and enhance existing functionality.</li>
              <li><strong>Communication:</strong> To respond to inquiries, provide support, and send service-related notifications.</li>
              <li><strong>Security and Fraud Prevention:</strong> To protect our services and users from unauthorized access and illegal activities.</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
            </ul>
          </section>

          <section>
            <h2>How We Share Your Information</h2>
            <p>We may share your information with the following categories of recipients:</p>
            <ul>
              <li><strong>Service Providers:</strong> Third-party vendors that perform services on our behalf, such as payment processing (Stripe), analytics, and infrastructure. We only share your data with service providers who have agreed to comply with our privacy standards.</li>
              <li><strong>Legal Compliance and Protection:</strong> We may disclose your data when required by law, court order, or to protect the rights, property, or safety of our users or third parties.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, sale, or transfer of assets, customer information may be transferred to a purchaser under a confidentiality agreement.</li>
            </ul>
            <p>
              <strong>We do not and will not sell or deal in personal data or any customer information.</strong>
            </p>
          </section>

          <section>
            <h2>Data We Do Not Collect</h2>
            <p>
              Element Armory is a client-side capture tool. The HTML, CSS, and UI elements you capture using the extension are processed locally in your browser. We do not transmit or store the content of captured elements on our servers. Your captured output stays on your device unless you explicitly copy or export it yourself.
            </p>
          </section>

          <section>
            <h2>Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Our security measures include:
            </p>
            <ul>
              <li>Encryption of sensitive data both in transit and at rest</li>
              <li>Regular security assessments and access controls</li>
              <li>Secure data storage on AWS infrastructure</li>
              <li>Incident response and breach notification procedures</li>
            </ul>
            <p>
              No method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security but are committed to maintaining high standards of data protection.
            </p>
          </section>

          <section>
            <h2>Your Privacy Rights</h2>
            <p>
              Depending on your location, you may have the following rights regarding your personal data:
            </p>
            <ul>
              <li>The right to access your personal information</li>
              <li>The right to correct inaccurate or incomplete information</li>
              <li>The right to deletion of your personal information</li>
              <li>The right to restrict or object to processing</li>
              <li>The right to data portability</li>
              <li>The right to withdraw consent</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:support@elementarmory.com">support@elementarmory.com</a>.
            </p>
          </section>

          <section>
            <h2>Children&apos;s Privacy</h2>
            <p>
              Our services are not directed to children under the age of 16. We do not knowingly collect personal information from children. If you believe your child has provided us with personal information, please contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2>Links to Other Websites</h2>
            <p>
              Our website and extension may contain links to third-party websites or services not owned or controlled by Element Armory. This Privacy Policy applies solely to information collected by Element Armory. We are not responsible for the privacy practices of third-party websites.
            </p>
          </section>

          <section>
            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes through our website or by email. Your continued use of our services after any changes indicates your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>
              If you have questions or requests regarding this Privacy Policy or our data practices, please contact us at:{" "}
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
