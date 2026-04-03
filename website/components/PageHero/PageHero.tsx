import { Section } from "@/components/Section";
import type { ReactNode } from "react";
import "./PageHero.css";

interface PageHeroProps {
  title: string;
  subtitle: ReactNode;
}

/**
 * Standard hero for content/utility pages (help, terms, privacy, cookies, etc.).
 *
 * Must use outer Section + inner Section:
 * - Outer: provides paddingTop and page structure
 * - Inner: uses gap: --space-5 (32px) between title and subtitle
 *
 * Without the inner Section, the outer section's gap: --section-gap (256px)
 * applies between h1 and p, making the hero enormous.
 */
export function PageHero({ title, subtitle }: PageHeroProps): React.ReactElement {
  return (
    <Section className="page-hero" style={{ paddingTop: "var(--space-7)", paddingBottom: 0 }}>
      <Section inner>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </Section>
    </Section>
  );
}
