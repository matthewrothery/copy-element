import type { SectionHeadingProps } from "./types";
import "./SectionHeading.css";

export function SectionHeading({
  subheading,
  title,
  subtitle,
  titleId,
  align = "center",
}: SectionHeadingProps): React.ReactElement {
  const showPill = subheading != null && subheading !== "";

  return (
    <div
      className={`section-heading ${align === "left" ? "section-heading--left" : ""}`}
      role={titleId != null ? "group" : undefined}
      aria-labelledby={titleId ?? undefined}
    >
      {showPill && <span className="section-heading-pill">{subheading}</span>}
      {title != null && (
        <h2 id={titleId ?? undefined} className="section-heading-title">
          {title}
        </h2>
      )}
      {subtitle != null && (
        <div className="section-heading-subtitle">{subtitle}</div>
      )}
    </div>
  );
}
