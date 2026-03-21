import type { ReactNode } from "react";

/** Runtime status derived from animation phase (or forced final for reduced motion). */
export type PipelineStepStatus = "pending" | "running" | "success" | "skipped";

/** First column: capture messaging (no decorative form controls). */
export interface PipelineCaptureConfig {
  title: string;
  subtitle?: string;
}

export interface PipelineHubConfig {
  id: string;
  icon?: ReactNode;
  title: string;
  subtitle: string;
  /** Shown when hub reaches success (e.g. duration-style line). */
  successDetail: string;
}

export interface PipelineBranchStep {
  id: string;
  icon?: ReactNode;
  title: string;
  runningDetail: string;
  successDetail: string;
  skippedDetail?: string;
}

export interface PipelineBranch {
  id: string;
  steps: PipelineBranchStep[];
  /** Entire branch is skipped (one step, faded). */
  skipped?: boolean;
}

export interface PipelineGraphData {
  capture: PipelineCaptureConfig;
  hub: PipelineHubConfig;
  branches: PipelineBranch[];
}

export interface PipelineDiagramProps {
  graph: PipelineGraphData;
  className?: string;
}
