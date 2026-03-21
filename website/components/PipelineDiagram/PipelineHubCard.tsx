import type { ReactElement } from "react";
import { Search } from "lucide-react";
import { PipelineStatusGlyph } from "./PipelineStatusGlyph";
import type { PipelineHubConfig, PipelineStepStatus } from "./types";

export function PipelineHubCard({
  config,
  status,
  visible,
}: {
  config: PipelineHubConfig;
  status: PipelineStepStatus;
  visible: boolean;
}): ReactElement {
  const icon =
    config.icon != null ? (
      config.icon
    ) : (
      <Search size={18} strokeWidth={2} aria-hidden="true" />
    );

  return (
    <div
      className={["pipeline-hub-card", visible ? "is-visible" : ""].filter(Boolean).join(" ")}
    >
      <div className="pipeline-hub-card-inner">
        <div className="pipeline-hub-card-icon" aria-hidden="true">
          {icon}
        </div>
        <div className="pipeline-hub-card-body">
          <div className="pipeline-hub-card-title-row">
            <PipelineStatusGlyph status={status} />
            <span className="pipeline-hub-card-title">{config.title}</span>
          </div>
          <div className="pipeline-hub-card-detail">
            {status === "running" && <span>{config.subtitle}</span>}
            {status === "success" && <span>{config.successDetail}</span>}
            {(status === "pending" || status === "skipped") && (
              <span className="pipeline-hub-card-placeholder">—</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
