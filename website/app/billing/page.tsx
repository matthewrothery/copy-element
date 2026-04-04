import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Section } from "@/components/Section";
import { BillingContent } from "@/components/BillingContent";
import styles from "./page.module.css";

export const metadata = {
  title: "Billing - Element Armory",
  description: "Manage your Element Armory billing and subscription.",
  robots: { index: false, follow: false },
};

export default function BillingPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section className="account-page" style={{ paddingTop: "var(--space-7)" }}>
          <Section inner>
            <h1 className="page-title">Billing</h1>
            <BillingContent />
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
