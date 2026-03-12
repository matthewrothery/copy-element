import { Header } from "@/components/Header";
import { Section } from "@/components/Section";

export const dynamic = "force-static";

export const metadata = {
  title: "Terms – Element Armory",
  description: "Element Armory terms of use.",
};

export default function TermsPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section style={{ paddingTop: "var(--space-7)" }}>
          <h1 className="page-title">Terms</h1>
          <p className="page-subtitle">
            Terms of use will be published here.
          </p>
        </Section>
      </main>
    </>
  );
}
