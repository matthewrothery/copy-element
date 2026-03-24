import { SectionHeading } from "@/components/SectionHeading";
import type { UseCaseComparisonProps } from "./types";
import "./UseCaseComparison.css";

export function UseCaseComparison({
  title = "Real-world scenarios",
  subtitle,
  ourTool,
  theirTool,
  scenarios,
}: UseCaseComparisonProps): React.ReactElement {
  return (
    <div className="ucc-root">
      <SectionHeading title={title} subtitle={subtitle} titleId="usecase-heading" />
      <ul className="ucc-list" aria-labelledby="usecase-heading">
        {scenarios.map((s) => (
          <li key={s.scenario} className="ucc-card">
            <p className="ucc-scenario">{s.scenario}</p>
            <div className="ucc-split">
              <div className="ucc-side ucc-side--ours">
                <span className="ucc-side-label">{ourTool}</span>
                <p className="ucc-side-text">{s.oursApproach}</p>
              </div>
              <div className="ucc-side ucc-side--theirs">
                <span className="ucc-side-label ucc-side-label--theirs">{theirTool}</span>
                <p className="ucc-side-text">{s.theirsApproach}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
