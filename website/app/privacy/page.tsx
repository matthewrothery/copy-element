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
            <h2>Introduction and Scope</h2>
            <p>
              Element Armory (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to protecting your privacy and handling personal information in a lawful, fair, and transparent manner. This Privacy Policy describes how we collect, use, disclose, retain, and otherwise process information in connection with the Element Armory website, browser extension, account services, billing flows, and related features (collectively, the &ldquo;Services&rdquo;).
            </p>
            <p>
              This Privacy Policy should be read together with our <Link href="/cookies">Cookie Policy</Link> and <Link href="/terms">Terms of Service</Link>. By accessing or using the Services, you acknowledge the practices described in this Privacy Policy, subject to any rights you may have under applicable law.
            </p>
          </section>

          <section>
            <h2>Information We Collect</h2>
            <p>
              We collect information that you provide directly, information generated through your use of the Services, and certain information collected automatically from your browser, device, or extension installation.
            </p>

            <h3>Account and Identity Information</h3>
            <ul>
              <li><strong>Account registration data:</strong> If you create an account or sign in, we may collect your email address and other basic account identifiers associated with your chosen sign-in method.</li>
              <li><strong>Authentication and session data:</strong> We process information necessary to authenticate you, maintain your session, secure your account, and keep your extension connected to your account where applicable.</li>
            </ul>

            <h3>Captured Content and Library Data</h3>
            <ul>
              <li><strong>User-selected captured content:</strong> When you use the extension to capture a UI element, we process the HTML, CSS, and other associated content for the specific element you choose to capture.</li>
              <li><strong>Library records and metadata:</strong> We may store related library information such as titles, folders, previews, thumbnails, timestamps, and the source URL associated with a captured element.</li>
              <li><strong>Cloud sync data:</strong> If you sign in and use sync-enabled features, your saved library content and related metadata may be transmitted to and stored on our systems so it can be available across your devices.</li>
            </ul>

            <h3>Billing and Transaction Information</h3>
            <ul>
              <li><strong>Subscription and billing records:</strong> If you purchase a paid plan, we may receive and store billing-related records such as customer identifiers, subscription status, plan information, renewal status, and transaction metadata.</li>
              <li><strong>Payment processing information:</strong> Payments are processed by Stripe and other applicable payment partners. We do not store full payment card numbers on our own servers.</li>
            </ul>

            <h3>Usage, Device, and Technical Information</h3>
            <ul>
              <li><strong>Website usage data:</strong> We collect information regarding your interaction with our website, such as pages viewed, referral source, campaign parameters, and general usage patterns.</li>
              <li><strong>Extension activity data:</strong> We may collect install-level or session-level event data regarding use of the extension, such as installation, opening the extension, capture events, export actions, sign-in prompts, and other product interaction events.</li>
              <li><strong>Technical and log data:</strong> We may collect IP address, browser type, device type, operating system, approximate geolocation derived from IP, timestamps, user agent information, and diagnostic or security logs.</li>
              <li><strong>Cookies and similar technologies:</strong> We use cookies, local storage, session storage, and comparable technologies as described in our <Link href="/cookies">Cookie Policy</Link>.</li>
            </ul>
          </section>

          <section>
            <h2>How We Use Your Information</h2>
            <p>We may use personal information for the following business and commercial purposes:</p>
            <ul>
              <li><strong>Service delivery:</strong> To operate the website and extension, create and administer accounts, store and organize your library, sync data across devices, and provide the features you request.</li>
              <li><strong>Authentication and account security:</strong> To verify identity, maintain sign-in state, prevent unauthorized access, and protect the integrity of our Services.</li>
              <li><strong>Billing administration:</strong> To process subscriptions, manage entitlements, prevent payment abuse, and maintain financial records.</li>
              <li><strong>Communications:</strong> To send transactional messages, sign-in links, support responses, service notices, security alerts, and other essential administrative communications.</li>
              <li><strong>Product improvement and analytics:</strong> To understand usage patterns, troubleshoot issues, measure performance, improve existing functionality, and develop new features.</li>
              <li><strong>Legal and compliance purposes:</strong> To comply with applicable law, enforce our agreements, protect our rights, and respond to lawful requests.</li>
            </ul>
          </section>

          <section>
            <h2>Legal Bases for Processing</h2>
            <p>
              Where applicable law requires a legal basis for processing personal information, we generally rely on one or more of the following grounds: (i) performance of a contract with you, including provision of the Services you request; (ii) our legitimate interests in operating, securing, improving, and administering the Services; (iii) your consent, where required; and (iv) compliance with legal obligations.
            </p>
          </section>

          <section>
            <h2>How We Disclose Information</h2>
            <p>We may disclose personal information in the following circumstances:</p>
            <ul>
              <li><strong>Service providers and processors:</strong> We may disclose information to vendors that provide services on our behalf, including hosting, cloud storage, analytics, authentication, email delivery, customer support, security, and payment processing.</li>
              <li><strong>At your direction:</strong> If you choose to connect Element Armory with third-party tools or services, or otherwise direct us to transmit your information, we may disclose relevant data as necessary to complete your request.</li>
              <li><strong>Corporate transactions:</strong> We may disclose information in connection with a merger, acquisition, financing, reorganization, sale of assets, or similar transaction, subject to appropriate confidentiality and legal safeguards.</li>
              <li><strong>Legal compliance and protection:</strong> We may disclose information where we believe such disclosure is required or appropriate to comply with law, regulation, legal process, or governmental request, or to protect the rights, property, safety, and security of Element Armory, our users, or others.</li>
            </ul>
            <p>
              <strong>We do not sell personal information and do not use captured content for advertising unrelated to the Services.</strong>
            </p>
          </section>

          <section>
            <h2>Captured Content and Source URLs</h2>
            <p>
              Element Armory is designed to process the content that you expressly choose to capture. When you capture a UI element, the selected element content and related styling data are processed to create a reusable snippet. If you use only local features, that information may remain on your device. If you sign in and use cloud-backed features, the captured content, associated source URL, preview assets, and related metadata may be stored on our systems in order to provide library sync, backup, and account-linked access across devices.
            </p>
            <p>
              We do not treat your general browsing history as a product dataset. However, when you intentionally capture content from a page, the source URL for that captured item may be stored as part of the corresponding snippet record.
            </p>
          </section>

          <section>
            <h2>Cookies and Similar Technologies</h2>
            <p>
              We and our service providers may use cookies, pixels, local storage, session storage, and similar technologies to remember preferences, maintain sessions, measure usage, attribute campaigns, improve performance, and secure the Services. Additional information regarding these practices is set out in our <Link href="/cookies">Cookie Policy</Link>.
            </p>
          </section>

          <section>
            <h2>Data Retention</h2>
            <p>
              We retain personal information for as long as reasonably necessary to fulfill the purposes described in this Privacy Policy, including to provide the Services, maintain your account, comply with legal obligations, resolve disputes, and enforce our agreements. Retention periods may vary depending on the nature of the information, the sensitivity of the data, whether the information relates to an active account or subscription, and applicable legal requirements.
            </p>
            <p>
              Information stored locally within the browser extension may remain on your device unless you remove it through the product, clear your browser storage, or uninstall the extension. Information stored in connection with an account may remain associated with that account until deleted, subject to backup, security, fraud-prevention, and legal retention requirements.
            </p>
          </section>

          <section>
            <h2>Data Security</h2>
            <p>
              We implement reasonable technical and organizational safeguards designed to protect personal information against unauthorized access, loss, misuse, alteration, and disclosure. These safeguards may include access controls, encryption in transit, secured storage environments, logging, and other security measures appropriate to the nature of the information processed.
            </p>
            <p>
              Notwithstanding the foregoing, no method of transmission over the Internet, and no method of electronic storage, is entirely secure. Accordingly, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2>Your Privacy Rights</h2>
            <p>
              Depending on your jurisdiction, you may have certain rights in relation to your personal information, subject to legal limitations and verification of your identity. These rights may include:
            </p>
            <ul>
              <li>The right to request access to personal information we hold about you</li>
              <li>The right to request correction of inaccurate or incomplete information</li>
              <li>The right to request deletion of personal information, in certain circumstances</li>
              <li>The right to object to or request restriction of certain processing activities</li>
              <li>The right to data portability, where applicable</li>
              <li>The right to withdraw consent where processing is based on consent</li>
            </ul>
            <p>
              To exercise any applicable rights, please contact us at{" "}
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
              The Services may contain links to third-party websites, products, or services that are not owned or controlled by Element Armory. This Privacy Policy applies only to information collected by or on behalf of Element Armory. We are not responsible for the privacy, security, or data handling practices of third parties.
            </p>
          </section>

          <section>
            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may amend this Privacy Policy from time to time to reflect changes in our Services, legal obligations, or operational practices. When we do so, we will post the updated version on this page and revise the &ldquo;Last updated&rdquo; date below. Where required by law, we will provide additional notice of material changes.
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
            <strong>Last updated:</strong> April 2026
          </p>
        </div>

        <Footer />
      </main>
    </>
  );
}
