import { Header } from "@/components/Header";

export const dynamic = "force-static";

export const metadata = {
  title: "Changelog – Element Armory",
  description: "Element Armory extension updates and release notes.",
};

export default function ChangelogPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main className="section" style={{ paddingTop: "var(--space-7)" }}>
        <h1 className="hero-title">Changelog</h1>
        <p className="hero-subtitle" style={{ textAlign: "left", maxWidth: "60ch" }}>
          Release notes and updates will be posted here.
        </p>
      </main>
    </>
  );
}
