import { StructuredData } from "@/components/StructuredData";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { SupportForm } from "@/components/SupportForm";
import { buildPageMetadata, webPageSchema } from "@/lib/seo";

export const dynamic = "force-static";

const SUPPORT_TITLE = "Element Armory Support for UI Capture Workflows";
const SUPPORT_DESCRIPTION =
  "Get help with Element Armory captures, accounts, billing, and MCP setup. Submit a support request and we will get back to you.";

export const metadata = buildPageMetadata({
  title: SUPPORT_TITLE,
  description: SUPPORT_DESCRIPTION,
  path: "/support",
});

export default function SupportPage(): React.ReactElement {
  return (
    <>
      <StructuredData
        data={webPageSchema({
          name: SUPPORT_TITLE,
          description: SUPPORT_DESCRIPTION,
          path: "/support",
        })}
      />
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
