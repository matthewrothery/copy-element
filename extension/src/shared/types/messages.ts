import type { CapturedElementData, Snippet } from "./snippet";

export type RuntimeMessage =
  | { type: "START_CAPTURE" }
  | { type: "CANCEL_CAPTURE" }
  | { type: "ELEMENT_CAPTURED"; payload: CapturedElementData }
  | { type: "SAVE_SNIPPET"; payload: Snippet }
  | { type: "GET_SNIPPETS" }
  | { type: "DELETE_SNIPPET"; payload: { id: string } };
