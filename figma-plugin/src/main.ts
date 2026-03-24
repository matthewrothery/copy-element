/**
 * Element Armory Figma plugin — main thread.
 * Only Figma API here; no DOM/browser APIs.
 * Compiled with module: "None" — no imports allowed.
 */

// Inline types matching src/ui/utils/htmlToFigmaTree.ts (kept in sync manually)
interface FigmaSolidFill { type: "SOLID"; r: number; g: number; b: number; a: number; }
interface FigmaStroke { r: number; g: number; b: number; weight: number; }
interface FigmaDropShadow {
  type: "DROP_SHADOW"; r: number; g: number; b: number; a: number;
  offsetX: number; offsetY: number; blur: number; spread: number;
}
interface FigmaNodeSpec {
  type: "FRAME" | "TEXT";
  name: string; x: number; y: number; width: number; height: number; opacity: number;
  fills: FigmaSolidFill[]; strokes: FigmaStroke[]; effects: FigmaDropShadow[];
  cornerRadius: number;
  paddingTop: number; paddingRight: number; paddingBottom: number; paddingLeft: number;
  layoutMode: "HORIZONTAL" | "VERTICAL" | "NONE"; itemSpacing: number;
  children: FigmaNodeSpec[];
  characters: string; fontSize: number; fontFamily: string; fontWeight: number;
  lineHeight: number; textAlignHorizontal: "LEFT" | "RIGHT" | "CENTER" | "JUSTIFIED";
  textColor: FigmaSolidFill | null;
}

figma.showUI(__html__, { width: 360, height: 600 });

figma.ui.onmessage = async function (msg: {
  type: string;
  key?: string;
  value?: unknown;
  url?: string;
  message?: string;
  payload?: { spec?: FigmaNodeSpec };
}) {
  switch (msg.type) {

    case "GET_STORAGE_VALUE": {
      var storageKey = msg.key as string;
      var storageVal = await figma.clientStorage.getAsync(storageKey);
      figma.ui.postMessage({ type: "STORAGE_VALUE", key: storageKey, value: storageVal ?? null });
      break;
    }

    case "SET_STORAGE_VALUE": {
      var setKey = msg.key as string;
      var setVal = msg.value;
      if (setVal === null || setVal === undefined) {
        await figma.clientStorage.deleteAsync(setKey);
      } else {
        await figma.clientStorage.setAsync(setKey, setVal);
      }
      figma.ui.postMessage({ type: "STORAGE_SET_OK", key: setKey });
      break;
    }

    case "OPEN_URL": {
      figma.openExternal(msg.url as string);
      break;
    }

    case "NOTIFY": {
      if (typeof msg.message === "string") figma.notify(msg.message);
      break;
    }

    case "BUILD_FRAME": {
      var spec = msg.payload && msg.payload.spec;
      if (!spec) { figma.notify("No frame spec provided."); break; }
      try {
        var rootNode = await createNodeFromSpec(spec);
        figma.currentPage.appendChild(rootNode);
        figma.viewport.scrollAndZoomIntoView([rootNode]);
        figma.notify("Inserted: " + spec.name);
        figma.ui.postMessage({ type: "FRAME_INSERTED" });
      } catch (err) {
        figma.notify("Insert failed: " + (err instanceof Error ? err.message : "unknown error"));
        figma.ui.postMessage({ type: "FRAME_INSERT_ERROR" });
      }
      break;
    }

    default:
      break;
  }
};

function solidPaint(fill: FigmaSolidFill): SolidPaint {
  return { type: "SOLID", color: { r: fill.r, g: fill.g, b: fill.b }, opacity: fill.a };
}

function dropShadowEffect(s: FigmaDropShadow): DropShadowEffect {
  return {
    type: "DROP_SHADOW",
    color: { r: s.r, g: s.g, b: s.b, a: s.a },
    offset: { x: s.offsetX, y: s.offsetY },
    radius: s.blur,
    spread: s.spread,
    visible: true,
    blendMode: "NORMAL",
    showShadowBehindNode: false,
  };
}

async function loadFontSafe(family: string, weight: number): Promise<FontName> {
  var style = weight >= 700 ? "Bold" : weight >= 500 ? "Medium" : "Regular";
  try {
    await figma.loadFontAsync({ family: family, style: style });
    return { family: family, style: style };
  } catch (_e) {
    try {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    } catch (_e2) { /* best-effort */ }
    return { family: "Inter", style: "Regular" };
  }
}

async function createNodeFromSpec(spec: FigmaNodeSpec): Promise<FrameNode | TextNode> {
  if (spec.type === "TEXT") {
    var textNode = figma.createText();
    var fontName = await loadFontSafe(spec.fontFamily, spec.fontWeight);
    textNode.fontName = fontName;
    textNode.fontSize = spec.fontSize > 0 ? spec.fontSize : 14;
    if (spec.lineHeight > 0) {
      textNode.lineHeight = { value: spec.lineHeight, unit: "PIXELS" };
    } else {
      textNode.lineHeight = { unit: "AUTO" };
    }
    textNode.textAlignHorizontal = spec.textAlignHorizontal;
    textNode.characters = spec.characters || " ";
    if (spec.textColor) {
      textNode.fills = [solidPaint(spec.textColor)];
    }
    textNode.opacity = spec.opacity;
    if (spec.width > 0 && spec.height > 0) {
      textNode.textAutoResize = "NONE";
      textNode.resize(spec.width, spec.height);
    }
    textNode.x = spec.x;
    textNode.y = spec.y;
    return textNode;
  }

  var frame = figma.createFrame();
  frame.name = spec.name;
  if (spec.width > 0 && spec.height > 0) {
    frame.resize(spec.width, spec.height);
  }
  frame.x = spec.x;
  frame.y = spec.y;
  frame.opacity = spec.opacity;
  frame.fills = spec.fills.length > 0 ? spec.fills.map(solidPaint) : [];

  if (spec.strokes.length > 0) {
    var s = spec.strokes[0];
    frame.strokes = [{ type: "SOLID", color: { r: s.r, g: s.g, b: s.b } }];
    frame.strokeWeight = s.weight;
    frame.strokeAlign = "INSIDE";
  }

  frame.effects = spec.effects.length > 0 ? spec.effects.map(dropShadowEffect) : [];
  frame.cornerRadius = spec.cornerRadius;

  if (spec.layoutMode !== "NONE") {
    frame.layoutMode = spec.layoutMode;
    frame.paddingTop = spec.paddingTop;
    frame.paddingRight = spec.paddingRight;
    frame.paddingBottom = spec.paddingBottom;
    frame.paddingLeft = spec.paddingLeft;
    frame.itemSpacing = spec.itemSpacing;
    frame.primaryAxisSizingMode = "AUTO";
    frame.counterAxisSizingMode = "AUTO";
  } else {
    frame.clipsContent = false;
  }

  for (var i = 0; i < spec.children.length; i++) {
    var child = await createNodeFromSpec(spec.children[i]);
    frame.appendChild(child);
  }

  return frame;
}
