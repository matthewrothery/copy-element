import { Header } from "@/components/Header";

export const dynamic = "force-static";

export const metadata = {
  title: "Roadmap – Element Capture",
  description: "Element Capture product roadmap and planned features.",
};

export default function RoadmapPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main className="section" style={{ paddingTop: "var(--space-7)" }}>
        <h1 className="hero-title">Roadmap</h1>
        <p className="hero-subtitle" style={{ textAlign: "left", maxWidth: "60ch" }}>
          Planned features and improvements will be listed here.
        </p>
      </main>
    </>
  );
}
