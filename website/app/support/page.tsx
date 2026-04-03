import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { SupportForm } from "@/components/SupportForm";

export const dynamic = "force-static";

export const metadata = {
  title: "Contact Support – Element Armory",
  description: "Get help with Element Armory. Submit a support request and we'll get back to you.",
  alternates: { canonical: "/support" },
};

export default function SupportPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <PageHero
          title="Contact Support"
          subtitle={<>Having an issue or a question? <br />Send us a message and we&apos;ll get back to you.</>}
        />
        <Section id="support-form">
          <SupportForm />
        </Section>
        <Footer />
      </main>
    </>
  );
}
