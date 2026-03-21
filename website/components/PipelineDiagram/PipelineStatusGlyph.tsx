import type { ReactElement } from "react";
import { Check, CircleSlash, Loader2 } from "lucide-react";
import type { PipelineStepStatus } from "./types";

export function PipelineStatusGlyph({ status }: { status: PipelineStepStatus }): ReactElement {
  if (status === "running") {
    return (
      <Loader2 className="pipeline-status-icon pipeline-status-icon--spin" size={16} aria-hidden="true" />
    );
  }
  if (status === "success") {
    return <Check className="pipeline-status-icon pipeline-status-icon--ok" size={16} aria-hidden="true" />;
  }
  if (status === "skipped") {
    return (
      <CircleSlash className="pipeline-status-icon pipeline-status-icon--skip" size={16} aria-hidden="true" />
    );
  }
  return <span className="pipeline-status-spacer" aria-hidden="true" />;
}
