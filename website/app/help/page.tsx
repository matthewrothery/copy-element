import { Header } from "@/components/Header";

export const dynamic = "force-static";

export const metadata = {
  title: "Help – Element Armory",
  description: "Element Armory help and documentation.",
};

export default function HelpPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main className="section" style={{ paddingTop: "var(--space-7)" }}>
        <h1 className="hero-title">Help</h1>
        <p className="hero-subtitle" style={{ textAlign: "left", maxWidth: "60ch" }}>
          Documentation and support for Element Armory will be available here.
        </p>
      </main>
    </>
  );
}
