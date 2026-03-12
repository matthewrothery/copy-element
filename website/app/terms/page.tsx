import { Header } from "@/components/Header";

export const dynamic = "force-static";

export const metadata = {
  title: "Terms – Element Capture",
  description: "Element Capture terms of use.",
};

export default function TermsPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main className="section" style={{ paddingTop: "var(--space-7)" }}>
        <h1 className="hero-title">Terms</h1>
        <p className="hero-subtitle" style={{ textAlign: "left", maxWidth: "60ch" }}>
          Terms of use will be published here.
        </p>
      </main>
    </>
  );
}
