"use client";

import { ClipboardPaste, Code2, Plug2, Sparkles, Wand2 } from "lucide-react";
import { PipelineDiagram } from "./PipelineDiagram";
import type { PipelineGraphData } from "./types";

const PIPELINE_GRAPH: PipelineGraphData = {
  capture: {
    title: "Capture an element from any site",
  },
  hub: {
    id: "extract",
    title: "Extract components",
    subtitle: "Cleaning HTML & CSS…",
    successDetail: "Snapshot ready · HTML + CSS + assets",
  },
  branches: [
    {
      id: "export",
      steps: [
        {
          id: "export-code",
          icon: <Code2 size={18} strokeWidth={2} aria-hidden="true" />,
          title: "Export code",
          runningDetail: "Exporting…",
          successDetail: "Ready to copy",
        },
        {
          id: "paste",
          icon: <ClipboardPaste size={18} strokeWidth={2} aria-hidden="true" />,
          title: "Paste anywhere",
          runningDetail: "Preparing…",
          successDetail: "Paste into your app",
        },
      ],
    },
    {
      id: "mcp-ai",
      steps: [
        {
          id: "mcp",
          icon: <Plug2 size={18} strokeWidth={2} aria-hidden="true" />,
          title: "Connect MCP",
          runningDetail: "Connecting…",
          successDetail: "Linked to your editor",
        },
        {
          id: "create-ai",
          icon: <Wand2 size={18} strokeWidth={2} aria-hidden="true" />,
          title: "Create with AI",
          runningDetail: "Generating…",
          successDetail: "Duration: 2m 14s",
        },
      ],
    },
    {
      id: "design-skipped",
      skipped: true,
      steps: [
        {
          id: "design-ai",
          icon: <Sparkles size={18} strokeWidth={2} aria-hidden="true" />,
          title: "Design ideas → AI implementation",
          runningDetail: "",
          successDetail: "",
          skippedDetail: "Skipped",
        },
      ],
    },
  ],
};

export function PipelineDiagramSection(): React.ReactElement {
  return <PipelineDiagram graph={PIPELINE_GRAPH} />;
}
