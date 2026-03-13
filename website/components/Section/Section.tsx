import type { SectionProps } from "./types";
import "./Section.css";

export function Section({
  children,
  className,
  center,
  id,
  style,
  inner,
}: SectionProps): React.ReactElement {
  if (inner) {
    return (
      <div
        className={className ? `section-inner ${className}` : "section-inner"}
        id={id}
        style={style}
      >
        {children}
      </div>
    );
  }
  return (
    <section
      className={className ? `section ${className} ${center ? "center" : ""}` : `section ${center ? "center" : ""}`}
      id={id}
      style={style}
    >
      {children}
    </section>
  );
}
