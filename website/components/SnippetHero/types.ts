import type { ReactNode } from "react";

export type SnippetHeroProps = {
  /** Optional pill label above the headline. */
  subheading?: string;
  headline?: ReactNode;
  subtitle?: ReactNode;
};
