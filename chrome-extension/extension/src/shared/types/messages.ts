import type { Folder } from "./folder";
import type { CapturedElementData, Snippet } from "./snippet";

export type RuntimeErrorCode =
  | "NO_ACTIVE_TAB"
  | "UNSUPPORTED_TAB_URL"
  | "CONTENT_SCRIPT_UNREACHABLE"
  | "UNKNOWN_ERROR";

export type CaptureMode = "element" | "section" | "page" | "mobile-page" | "desktop-page";

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
    mode?: CaptureMode;
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

export interface GetSnippetByIdRequest {
  type: "GET_SNIPPET_BY_ID";
  payload: { id: string };
}

export interface GetLatestCaptureRequest {
  type: "GET_LATEST_CAPTURE";
}

export interface DeleteSnippetRequest {
  type: "DELETE_SNIPPET";
  payload: { id: string };
}

export interface GetFoldersRequest {
  type: "GET_FOLDERS";
}

export interface SaveFolderRequest {
  type: "SAVE_FOLDER";
  payload: Folder;
}

export interface DeleteFolderRequest {
  type: "DELETE_FOLDER";
  payload: { id: string };
}

export interface OpenLibraryTabRequest {
  type: "OPEN_LIBRARY_TAB";
}

export interface CaptureVisibleTabRequest {
  type: "CAPTURE_VISIBLE_TAB";
  payload?: {
    tabId?: number;
  };
}

export type ViewportPresetId = "desktop" | "laptop" | "tablet" | "phablet" | "phone";

export interface ExtractCssViaCdpRequest {
  type: "EXTRACT_CSS_VIA_CDP";
  payload: {
    tabId?: number;
    frameId?: number;
    selectors: string[];
    baseUrl: string;
    theme?: "light" | "dark";
    viewport?: ViewportPresetId;
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

export interface ExchangeAuthCodeRequest {
  type: "EXCHANGE_AUTH_CODE";
  payload: { code: string; install_id: string };
}

export interface GetAuthStateRequest {
  type: "GET_AUTH_STATE";
}

export interface SignOutRequest {
  type: "SIGN_OUT";
}

export interface GetInstallIdRequest {
  type: "GET_INSTALL_ID";
}

export interface FetchStylesheetTextRequest {
  type: "FETCH_STYLESHEET_TEXT";
  payload: { url: string };
}

export interface SetViewportEmulationRequest {
  type: "SET_VIEWPORT_EMULATION";
  payload: { viewport: ViewportPresetId; tabId?: number };
}

export interface ClearViewportEmulationRequest {
  type: "CLEAR_VIEWPORT_EMULATION";
  payload?: { tabId?: number };
}

export interface AuthStatePayload {
  signed_in: boolean;
  user_email: string | null;
  user_plan: string | null;
}

export interface RefreshPlanRequest {
  type: "REFRESH_PLAN";
}

export interface TrySilentAuthRequest {
  type: "TRY_SILENT_AUTH";
}

export interface TrySilentAuthPayload {
  success: boolean;
}

export interface RefreshPlanPayload {
  plan_code: string;
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
  | GetSnippetByIdRequest
  | GetLatestCaptureRequest
  | DeleteSnippetRequest
  | GetFoldersRequest
  | SaveFolderRequest
  | DeleteFolderRequest
  | OpenLibraryTabRequest
  | CaptureVisibleTabRequest
  | ExtractCssViaCdpRequest
  | ExchangeAuthCodeRequest
  | GetAuthStateRequest
  | SignOutRequest
  | GetInstallIdRequest
  | FetchStylesheetTextRequest
  | SetViewportEmulationRequest
  | ClearViewportEmulationRequest
  | RefreshPlanRequest
  | TrySilentAuthRequest;
