import { Header } from "@/components/Header";

export const dynamic = "force-static";

export const metadata = {
  title: "Examples – Element Armory",
  description: "Element Armory examples and use cases.",
};

export default function ExamplesPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main className="section" style={{ paddingTop: "var(--space-7)" }}>
        <h1 className="hero-title">Examples</h1>
        <p className="hero-subtitle" style={{ textAlign: "left", maxWidth: "60ch" }}>
          Example captures and use cases for Element Armory will be published here.
        </p>
      </main>
    </>
  );
}
