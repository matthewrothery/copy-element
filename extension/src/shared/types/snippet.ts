export interface Snippet {
  id: string;
  title: string;
  sourceUrl: string;
  html: string;
  jsx: string;
  thumbnail: string;
  createdAt: number;
  width: number;
  height: number;
}

export interface CapturedElementData {
  html: string;
  jsx: string;
  width: number;
  height: number;
  elementLabel: string;
}

export type CaptureState = "idle" | "active";
