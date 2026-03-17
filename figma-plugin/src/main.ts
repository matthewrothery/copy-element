/**
 * Element Armory Figma plugin — main thread.
 * Only Figma API here; no DOM/browser APIs.
 */

figma.showUI(__html__, { width: 360, height: 600 });

figma.ui.onmessage = function (msg: { type: string; payload?: unknown }) {
  switch (msg.type) {
    case "INSERT_ELEMENT": {
      var payload = msg.payload as { name?: string } | undefined;
      var name =
        payload && typeof payload === "object" && typeof payload.name === "string"
          ? payload.name
          : "Element";
      var frame = figma.createFrame();
      frame.resize(400, 200);
      frame.name = name;

      figma.currentPage.appendChild(frame);
      figma.viewport.scrollAndZoomIntoView([frame]);
      figma.notify("Inserted: " + name);
      break;
    }
    case "CREATE_COMPONENT": {
      // Placeholder: create component from payload when API is ready
      figma.notify("Component creation coming soon");
      break;
    }
    default:
      break;
  }
};
