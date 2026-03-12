import { Header } from "@/components/Header";
import { Section } from "@/components/Section";

export const dynamic = "force-static";

export const metadata = {
  title: "Roadmap – Element Armory",
  description: "Element Armory product roadmap and planned features.",
};

export default function RoadmapPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section style={{ paddingTop: "var(--space-7)" }}>
          <h1 className="page-title">Roadmap</h1>
          <p className="page-subtitle">
            Planned features and improvements will be listed here.
          </p>
        </Section>
      </main>
    </>
  );
}
