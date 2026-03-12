import type { CSSProperties, ReactNode } from "react";

export type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
  /** Use section-inner for extra wrapper (e.g. pricing page) */
  inner?: boolean;
};
