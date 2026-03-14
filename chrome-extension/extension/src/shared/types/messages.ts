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

/** Sent by content script when one frame selected an element; background cancels pickers in other frames. */
export interface StopOtherPickersRequest {
  type: "STOP_OTHER_PICKERS";
  payload?: {
    tabId?: number;
    frameId?: number;
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

export interface ExtractCssViaCdpRequest {
  type: "EXTRACT_CSS_VIA_CDP";
  payload: {
    tabId?: number;
    selectors: string[];
    baseUrl: string;
  };
}

export interface ExtractCssViaCdpPayload {
  cssText: string;
  usedFontFamilies: string[];
  usedAnimationNames: string[];
  layerOrder: string[];
  fontFacesCss: string;
  keyframesCss: string;
  variableDefinitions: Array<{
    name: string;
    value: string;
    selector: string;
    media?: string;
    layerPath?: string;
    sourceOrder: number;
  }>;
  variableUsageContexts: Array<{
    cssText: string;
    media?: string;
    layerPath?: string;
  }>;
}

export type RuntimeMessage =
  | StartCaptureRequest
  | CancelCaptureRequest
  | StopOtherPickersRequest
  | ElementCapturedRequest
  | SaveSnippetRequest
  | GetSnippetsRequest
  | GetLatestCaptureRequest
  | DeleteSnippetRequest
  | CaptureVisibleTabRequest
  | ExtractCssViaCdpRequest;
