import type { DiagramSpec } from "./schema.js";
import { renderColumnsSvg } from "./renderColumns.js";
import { renderFlowSvg } from "./renderFlow.js";
import { renderStepsSvg } from "./renderSteps.js";

export function renderDiagramSvg(spec: DiagramSpec): string {
  switch (spec.kind) {
    case "flow":
      return renderFlowSvg(spec.nodes);
    case "columns":
      return renderColumnsSvg(spec.columns);
    case "steps":
      return renderStepsSvg(spec.labels);
    default: {
      const _exhaustive: never = spec;
      return _exhaustive;
    }
  }
}
