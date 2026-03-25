import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Section } from "@/components/Section";
import { AccountContent } from "@/components/AccountContent";

export const dynamic = "force-static";

export const metadata = {
  title: "Account – Element Armory",
  description: "Manage your Element Armory account and linked installs.",
  robots: { index: false, follow: false },
};

export default function AccountPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section className="account-page" style={{ paddingTop: "var(--space-7)" }}>
          <Section inner>
            <h1 className="page-title">Account</h1>
            <AccountContent />
          </Section>
        </Section>
        <Footer />
      </main>
    </>
  );
}
