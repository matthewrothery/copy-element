"use client";

import { MousePointer2, Code2, Library, Plug2, Zap, Rocket } from "lucide-react";
import { PipelineDiagram } from "./PipelineDiagram";

const PIPELINE_NODES = [
  {
    id: "capture",
    icon: <MousePointer2 size={20} />,
    title: "Capture UI from any site",
    subtitle: "Select any element in seconds",
    microcopy: "Click → Capture → Done",
  },
  {
    id: "extract",
    icon: <Code2 size={20} />,
    title: "Extract clean components",
    subtitle: "HTML, CSS, assets — cleaned automatically",
    microcopy: "HTML + CSS + Assets",
  },
  {
    id: "library",
    icon: <Library size={20} />,
    title: "Save to your library",
    subtitle: "All captures synced to your account",
    microcopy: "Always available. Across devices.",
  },
  {
    id: "mcp",
    icon: <Plug2 size={20} />,
    title: "Connect your AI via MCP",
    subtitle: "Works with Cursor, Claude Code, and more",
    highlight: true,
    microcopy: "One-time setup. Instant access.",
  },
  {
    id: "generate",
    icon: <Zap size={20} />,
    title: "Generate production code",
    subtitle: "AI rebuilds your UI instantly",
    tags: ["React", "Vue", "HTML", "Tailwind"],
  },
  {
    id: "ship",
    icon: <Rocket size={20} />,
    title: "Ship faster",
    subtitle: "From UI capture to working code in minutes",
    microcopy: "Build → Commit → Ship",
  },
];

export function PipelineDiagramSection(): React.ReactElement {
  return <PipelineDiagram nodes={PIPELINE_NODES} />;
}
