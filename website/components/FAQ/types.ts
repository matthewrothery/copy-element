export type FAQItem = {
  question: string;
  answer: string;
};

export type FAQProps = {
  /** FAQ entries. Uses default content if not provided. */
  items?: FAQItem[];
  /** Small pill label above the title (e.g. "FAQs"). Omitted if not provided. */
  subheading?: string;
  /** Section heading (e.g. "Frequently Asked Questions"). */
  title?: string;
  /** Optional subtitle below the heading. */
  subtitle?: string;
};
