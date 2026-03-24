export type FeatureStatus = "yes" | "no" | "partial";

export type ComparisonRow = {
  feature: string;
  note?: string;
  ours: FeatureStatus;
  theirs: FeatureStatus;
};

export type VerdictBox = { tool: string; reasons: string[] };
export type WorkflowStep = { label: string; description?: string };

export type ComparisonData = {
  slug: string;
  tools: {
    ours: { name: string };
    theirs: { name: string };
  };
  meta: { title: string; description: string; canonicalPath: string };
  hero: { title: string; subtitle: string; trustBadges?: string[] };
  verdict?: { ours: VerdictBox; theirs: VerdictBox };
  table?: { rows: ComparisonRow[] };
  workflow?: {
    title: string;
    subtitle?: string;
    ours: { tool: string; steps: WorkflowStep[] };
    theirs: { tool: string; steps: WorkflowStep[] };
  };
  useCases?: {
    title?: string;
    subtitle?: string;
    scenarios: { scenario: string; oursApproach: string; theirsApproach: string }[];
  };
  limitations?: {
    title?: string;
    subtitle?: string;
    items: { heading: string; description: string }[];
  };
  faq?: { question: string; answer: string }[];
};
