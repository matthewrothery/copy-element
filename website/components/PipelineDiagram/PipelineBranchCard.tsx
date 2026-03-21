import type { ReactElement } from "react";
import { PipelineStatusGlyph } from "./PipelineStatusGlyph";
import type { PipelineBranch, PipelineStepStatus } from "./types";

export function PipelineBranchCard({
  step,
  status,
  visible,
}: {
  step: PipelineBranch["steps"][0];
  status: PipelineStepStatus;
  visible: boolean;
}): ReactElement {
  const detail =
    status === "running"
      ? step.runningDetail
      : status === "success"
        ? step.successDetail
        : status === "skipped"
          ? (step.skippedDetail ?? "Skipped")
          : " ";

  return (
    <div
      className={[
        "pipeline-branch-card",
        status === "skipped" ? "pipeline-branch-card--skipped" : "",
        visible ? "is-visible" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="pipeline-branch-card-inner">
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
