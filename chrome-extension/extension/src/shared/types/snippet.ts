/**
 * Minimal parent layout CSS needed to reproduce flex/grid context.
 * Used when the captured element is a flex/grid child.
 */
export interface ParentLayoutContext {
  display: string;
  flexDirection?: string;
  flexWrap?: string;
  justifyContent?: string;
  alignItems?: string;
  alignContent?: string;
  gap?: string;
  columnGap?: string;
  rowGap?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridAutoFlow?: string;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
}

/**
 * Inherited text styles applied via wrapper to preserve global typography.
 */
export interface InheritedTextContext {
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: string;
  direction?: string;
}

export interface RenderContext {
  parentLayout?: ParentLayoutContext;
  inheritedText?: InheritedTextContext;
  visibleBackgroundColor?: string;
}

/**
 * Canonical snippet schema for storage. Used as the single source of truth for
 * persistence in chrome.storage.local.
 *
 * Required fields for persistence: id, title, html, jsx, thumbnail, sourceUrl,
 * createdAt, width, height. Optional fields (renderContext, styleBlock, rootId,
 * externalFontLinks) are stored when present for backward compatibility.
 */
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
  /** Optional layout context for preview fidelity (new captures only). */
  renderContext?: RenderContext;
  /** Optional CSS block (base + @media/@container) for preview/copy. */
  styleBlock?: string;
  /** Stable ID for snippet root so style block can target it. */
  rootId?: string;
  /** External font stylesheet links (e.g., Google Fonts) for cross-origin fonts. */
  externalFontLinks?: string[];
  /** Optional folder id. undefined/null = Library root. */
  folderId?: string | null;
  /** Cloud sync state. undefined = pre-sync era legacy snippet. 'syncing' = upload in flight. */
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed';
  /** Server-assigned capture ID (stringified integer). Set after successful sync. */
  serverCaptureId?: string;
}

export interface CapturedElementData {
  html: string;
  jsx: string;
  width: number;
  height: number;
  elementLabel: string;
  thumbnail?: string;
  renderContext?: RenderContext;
  styleBlock?: string;
  rootId?: string;
  /** True when the captured element or its subtree involves Shadow DOM. */
  hasShadowDom?: boolean;
  /** External font stylesheet links (e.g., Google Fonts) for cross-origin fonts. */
  externalFontLinks?: string[];
}

export type CaptureState = "idle" | "active";
