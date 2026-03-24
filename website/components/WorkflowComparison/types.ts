import type { WorkflowStep } from "@/data/comparisons/types";

export type WorkflowSide = {
  tool: string;
  steps: WorkflowStep[];
};

export type WorkflowComparisonProps = {
  title: string;
  subtitle?: string;
  ours: WorkflowSide;
  theirs: WorkflowSide;
};
