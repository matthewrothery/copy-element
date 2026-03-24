import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";

export const dynamic = "force-static";

export const metadata = {
  title: "Help – Element Armory",
  description: "Element Armory help and documentation.",
};

export default function HelpPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main className="content-page">
        <PageHero
          title="Help"
          subtitle="Documentation and support for Element Armory will be available here."
        />

        <Section id="faq">
          <FAQ />
        </Section>

        <Footer />
      </main>
    </>
  );
}
