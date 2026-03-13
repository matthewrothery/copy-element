import type { ReactNode } from "react";

export type SectionHeadingProps = {
  /** Small pill label above the title (e.g. "FAQs"). Omitted if not provided or empty. */
  subheading?: string;
  /** Main section heading. Optional when used as pill-only (e.g. SnippetHero). */
  title?: ReactNode;
  /** Optional supporting text below the title. */
  subtitle?: ReactNode;
  /** Id for the h2 (for aria-labelledby on section). */
  titleId?: string;
  /** Alignment of the heading block. Default "center". */
  align?: "center" | "left";
};
