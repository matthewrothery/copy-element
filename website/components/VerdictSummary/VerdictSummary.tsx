import { SectionHeading } from "@/components/SectionHeading";
import type { VerdictSummaryProps } from "./types";
import "./VerdictSummary.css";

export function VerdictSummary({
  ours,
  theirs,
}: VerdictSummaryProps): React.ReactElement {
  return (
    <div className="vs-root">
      <SectionHeading
        title="Which tool is right for you?"
        titleId="verdict-heading"
      />
      <div className="vs-grid" aria-labelledby="verdict-heading">
        <div className="vs-card vs-card--ours">
          <p className="vs-card-label">Choose {ours.tool} if…</p>
          <ul className="vs-list">
            {ours.reasons.map((reason) => (
              <li key={reason} className="vs-list-item">
                {reason}
              </li>
            ))}
          </ul>
        </div>
        <div className="vs-card vs-card--theirs">
          <p className="vs-card-label">Choose {theirs.tool} if…</p>
          <ul className="vs-list">
            {theirs.reasons.map((reason) => (
              <li key={reason} className="vs-list-item">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
