import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { UninstallFeedback } from "@/components/UninstallFeedback/UninstallFeedback";

export const dynamic = "force-static";

export const metadata = {
  title: "You've left – Element Armory",
  description: "Help us improve by sharing why you uninstalled Element Armory.",
};

export default function UninstallPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <PageHero
          title="Sorry to see you go."
          subtitle="Take 30 seconds to tell us why - it helps us improve."
        />
        <Section id="feedback">
          <UninstallFeedback />
        </Section>
        <Footer />
      </main>
    </>
  );
}
