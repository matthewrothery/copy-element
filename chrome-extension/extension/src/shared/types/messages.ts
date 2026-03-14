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

/** Sent by content script when user presses Escape in picker; background broadcasts CANCEL_CAPTURE to all frames. */
export interface BroadcastCancelCaptureRequest {
  type: "BROADCAST_CANCEL_CAPTURE";
}

/** Sent by content script when this frame has active hover in picker; background tells other frames to clear their overlay. */
export interface FrameHoverActiveRequest {
  type: "FRAME_HOVER_ACTIVE";
}

/** Sent by background to content; clear hover/selection overlay only (picker stays active). */
export interface ClearFrameHoverRequest {
  type: "CLEAR_FRAME_HOVER";
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
    frameId?: number;
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
  | BroadcastCancelCaptureRequest
  | FrameHoverActiveRequest
  | ClearFrameHoverRequest
  | ElementCapturedRequest
  | SaveSnippetRequest
  | GetSnippetsRequest
  | GetLatestCaptureRequest
  | DeleteSnippetRequest
  | CaptureVisibleTabRequest
  | ExtractCssViaCdpRequest;
