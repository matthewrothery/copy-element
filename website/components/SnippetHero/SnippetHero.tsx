import { SectionHeading } from "@/components/SectionHeading";
import type { SnippetHeroProps } from "./types";
import "./SnippetHero.css";

const defaultHeadline = (
  <>
    <p>Capture UI from any site.</p>
    <p>Rebuild it with AI.</p>
  </>
);

const defaultSubtitle = (
  <>
    <p>
      <strong>Clean. Clear. Powerful.</strong>
    </p>
    <p>
      Click any element to copy clean HTML or JSX. No scripts or bloat—just the
      styles you need.
    </p>
  </>
);

export function SnippetHero({
  subheading,
  headline = defaultHeadline,
  subtitle = defaultSubtitle,
}: SnippetHeroProps): React.ReactElement {
  return (
    <div className="snippet-hero">
      {subheading != null && subheading !== "" && (
        <SectionHeading subheading={subheading} />
      )}
      <h2 className="snippet-hero-headline">{headline}</h2>
      <div className="snippet-hero-subtitle">{subtitle}</div>
    </div>
  );
}
