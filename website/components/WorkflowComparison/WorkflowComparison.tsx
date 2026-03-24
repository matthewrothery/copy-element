import { SectionHeading } from "@/components/SectionHeading";
import type { WorkflowComparisonProps } from "./types";
import "./WorkflowComparison.css";

export function WorkflowComparison({
  title,
  subtitle,
  ours,
  theirs,
}: WorkflowComparisonProps): React.ReactElement {
  return (
    <div className="wc-root">
      <SectionHeading title={title} subtitle={subtitle} titleId="workflow-heading" />
      <div className="wc-grid" aria-labelledby="workflow-heading">
        <div className="wc-col wc-col--ours">
          <p className="wc-col-label">{ours.tool}</p>
          <ol className="wc-steps">
            {ours.steps.map((step, i) => (
              <li key={step.label} className="wc-step">
                <span className="wc-step-number wc-step-number--ours">{i + 1}</span>
                <div className="wc-step-body">
                  <span className="wc-step-label">{step.label}</span>
                  {step.description != null && (
                    <span className="wc-step-desc">{step.description}</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="wc-col wc-col--theirs">
          <p className="wc-col-label">{theirs.tool}</p>
          <ol className="wc-steps">
            {theirs.steps.map((step, i) => (
              <li key={step.label} className="wc-step">
                <span className="wc-step-number">{i + 1}</span>
                <div className="wc-step-body">
                  <span className="wc-step-label">{step.label}</span>
                  {step.description != null && (
                    <span className="wc-step-desc">{step.description}</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
