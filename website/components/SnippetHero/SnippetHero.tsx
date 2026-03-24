import { SectionHeading } from "@/components/SectionHeading";
import type { SnippetHeroProps } from "./types";
import "./SnippetHero.css";

const defaultHeadline = (
  <>
    <p>From any website</p>
    <p>to your editor in seconds.</p>
  </>
);

const defaultSubtitle = (
  <>
    <p>
      Your captured elements, organized and ready. Copy HTML or JSX whenever
      you need them — no hunting through tabs.
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
