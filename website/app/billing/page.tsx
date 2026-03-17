import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Section } from "@/components/Section";
import styles from "./page.module.css";

export const dynamic = "force-static";

export const metadata = {
  title: "Billing – Element Armory",
  description: "Manage your Element Armory billing and subscription.",
};

export default function BillingPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section className="account-page" style={{ paddingTop: "var(--space-7)" }}>
          <Section inner>
            <h1 className="page-title">Billing</h1>
            <p className="page-subtitle">
              Coming in Phase 3. Stripe Checkout and Customer Portal will be available here.
            </p>
            <p>
              <Link href="/account" className={styles["back-link"]}>
                Back to account
              </Link>
            </p>
          </Section>
        </Section>
        <Footer />
      </main>
    </>
  );
}
