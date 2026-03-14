import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Section } from "@/components/Section";

export const dynamic = "force-static";

export const metadata = {
  title: "Privacy – Element Armory",
  description: "Element Armory privacy policy.",
};

export default function PrivacyPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section style={{ paddingTop: "var(--space-7)" }}>
          <h1 className="page-title">Privacy</h1>
          <p className="page-subtitle">
            Privacy policy will be published here.
          </p>
        </Section>

        <Section id="faq">
          <FAQ />
        </Section>

        <Footer />
      </main>
    </>
  );
}
