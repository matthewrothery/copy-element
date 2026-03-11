import type { CapturedElementData, Snippet } from "./snippet";

export type RuntimeErrorCode =
  | "NO_ACTIVE_TAB"
  | "UNSUPPORTED_TAB_URL"
  | "CONTENT_SCRIPT_UNREACHABLE"
  | "UNKNOWN_ERROR";

export interface RuntimeSuccessResponse<T> {
  ok: true;
  payload: T;
}

export interface RuntimeErrorResponse {
  ok: false;
  error: string;
  code: RuntimeErrorCode;
}

export type RuntimeResponse<T> = RuntimeSuccessResponse<T> | RuntimeErrorResponse;

export interface StartCaptureRequest {
  type: "START_CAPTURE";
  payload?: {
    tabId?: number;
  };
}

export interface CancelCaptureRequest {
  type: "CANCEL_CAPTURE";
  payload?: {
    tabId?: number;
  };
}

export interface ElementCapturedRequest {
  type: "ELEMENT_CAPTURED";
  payload: CapturedElementData;
}

export interface SaveSnippetRequest {
  type: "SAVE_SNIPPET";
  payload: Snippet;
}

export interface GetSnippetsRequest {
  type: "GET_SNIPPETS";
}

export interface GetLatestCaptureRequest {
  type: "GET_LATEST_CAPTURE";
}

export interface DeleteSnippetRequest {
  type: "DELETE_SNIPPET";
  payload: { id: string };
}

export interface CaptureVisibleTabRequest {
  type: "CAPTURE_VISIBLE_TAB";
  payload?: {
    tabId?: number;
  };
}

export type RuntimeMessage =
  | StartCaptureRequest
  | CancelCaptureRequest
  | ElementCapturedRequest
  | SaveSnippetRequest
  | GetSnippetsRequest
  | GetLatestCaptureRequest
  | DeleteSnippetRequest
  | CaptureVisibleTabRequest;
