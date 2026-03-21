import type { ReactElement } from "react";
import { PipelineStatusGlyph } from "./PipelineStatusGlyph";
import type { PipelineBranch, PipelineStepStatus } from "./types";

export function PipelineBranchCard({
  step,
  status,
  visible,
  terminalHighlight,
}: {
  step: PipelineBranch["steps"][0];
  status: PipelineStepStatus;
  visible: boolean;
  /** Last step on a non-skipped branch: animated border (pricing-card style) when success. */
  terminalHighlight?: boolean;
}): ReactElement {
  const detail =
    status === "running"
      ? step.runningDetail
      : status === "success"
        ? step.successDetail
        : status === "skipped"
          ? (step.skippedDetail ?? "Skipped")
          : " ";

  const showTrail = terminalHighlight === true;

  return (
    <div
      className={[
        "pipeline-branch-card",
        status === "skipped" ? "pipeline-branch-card--skipped" : "",
        showTrail ? "pipeline-branch-card--terminal" : "",
        visible ? "is-visible" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showTrail && (
        <div className="pipeline-branch-card-terminal-trail" aria-hidden="true">
          <div className="pipeline-branch-card-terminal-spot" />
        </div>
      )}
      <div
        className={[
          "pipeline-branch-card-inner",
          showTrail ? "pipeline-branch-card-inner--terminal" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {step.icon != null && (
          <div className="pipeline-branch-card-icon" aria-hidden="true">
            {step.icon}
          </div>
        )}
        <div className="pipeline-branch-card-body">
          <div className="pipeline-branch-card-title-row">
            <PipelineStatusGlyph status={status} />
            <span className="pipeline-branch-card-title">{step.title}</span>
          </div>
          <div
            className={[
              "pipeline-branch-card-detail",
              status === "skipped" ? "pipeline-branch-card-detail--muted" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {status === "pending" ? " " : detail}
          </div>
        </div>
      </div>
    </div>
  );
}
