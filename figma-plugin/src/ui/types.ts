/** A capture retrieved from the Element Armory backend. */
export interface CaptureItem {
  id: string;
  title: string;
  width: number;
  height: number;
  /** Optional source URL where the element was captured from */
  sourceUrl?: string;
  /** Capture timestamp in epoch milliseconds */
  capturedAt: number;
  /** Presigned URL for the screenshot thumbnail */
  screenshotUrl?: string;
  /** Presigned URL for the captured HTML file */
  htmlUrl?: string;
  /** Presigned URL for the captured stylesheet file */
  stylesheetUrl?: string;
}
