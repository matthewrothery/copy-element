import type { ComparisonRow } from "@/data/comparisons/types";

export type ComparisonTableProps = {
  ours: { name: string };
  theirs: { name: string };
  rows: ComparisonRow[];
};
