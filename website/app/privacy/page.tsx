import { Header } from "@/components/Header";

export const dynamic = "force-static";

export const metadata = {
  title: "Privacy – Element Capture",
  description: "Element Capture privacy policy.",
};

export default function PrivacyPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main className="section" style={{ paddingTop: "var(--space-7)" }}>
        <h1 className="hero-title">Privacy</h1>
        <p className="hero-subtitle" style={{ textAlign: "left", maxWidth: "60ch" }}>
          Privacy policy will be published here.
        </p>
      </main>
    </>
  );
}
