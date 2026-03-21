import type { ReactElement } from "react";
import type { PipelineCaptureConfig } from "./types";

export function PipelineCaptureCard({
  config,
  visible,
}: {
  config: PipelineCaptureConfig;
  visible: boolean;
}): ReactElement {
  return (
    <div
      className={["pipeline-capture-card", visible ? "is-visible" : ""].filter(Boolean).join(" ")}
    >
      <div className="pipeline-capture-card-inner">
        <div className="pipeline-capture-card-title">{config.title}</div>
        {config.subtitle != null && config.subtitle !== "" && (
          <div className="pipeline-capture-card-subtitle">{config.subtitle}</div>
        )}
      </div>
    </div>
  );
}
