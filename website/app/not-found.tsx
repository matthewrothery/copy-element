import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Page Not Found – Element Armory",
  description: "The page you are looking for does not exist.",
  robots: { index: false, follow: false },
};

export default function NotFound(): React.ReactElement {
  return (
    <>
      <Header />
      <main className="content-page">
        <div style={{ textAlign: "center", padding: "var(--space-8, 64px) var(--space-5, 32px)" }}>
          <h1 style={{ fontSize: "var(--typo-headline, 48px)", marginBottom: "var(--space-3, 12px)" }}>
            Page not found
          </h1>
          <p style={{ color: "var(--color-text-muted, #6b7280)", marginBottom: "var(--space-5, 32px)" }}>
            The page you are looking for does not exist or has been moved.
          </p>
          <div style={{ display: "flex", gap: "var(--space-3, 12px)", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/" style={{ color: "var(--color-accent, #3b82f6)" }}>
              Home
            </Link>
            <Link href="/product" style={{ color: "var(--color-accent, #3b82f6)" }}>
              How it works
            </Link>
            <Link href="/blog" style={{ color: "var(--color-accent, #3b82f6)" }}>
              Blog
            </Link>
            <Link href="/pricing" style={{ color: "var(--color-accent, #3b82f6)" }}>
              Pricing
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
