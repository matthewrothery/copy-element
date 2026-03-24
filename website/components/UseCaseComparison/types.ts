export type UseCaseScenario = {
  scenario: string;
  oursApproach: string;
  theirsApproach: string;
};

export type UseCaseComparisonProps = {
  title?: string;
  subtitle?: string;
  ourTool: string;
  theirTool: string;
  scenarios: UseCaseScenario[];
};
