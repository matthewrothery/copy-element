import { defineManifest } from "@crxjs/vite-plugin";

const extensionIcons = {
  "16": "extension/icons/icon-16.png",
  "32": "extension/icons/icon-32.png",
  "48": "extension/icons/icon-48.png",
  "128": "extension/icons/icon-128.png"
} as const;

export default defineManifest({
  manifest_version: 3,
  name: "Element Armory",
  description: "Capture and save styled page elements as reusable snippets.",
  version: "1.0.1",
  icons: extensionIcons,
  permissions: [
    "activeTab",
    "tabs",
    "storage",
    "unlimitedStorage",
    "clipboardWrite",
    "debugger",
    "webNavigation",
    "alarms"
  ],
  action: {
    default_title: "Element Armory",
    default_popup: "popup.html",
    default_icon: extensionIcons
  },
  background: {
    service_worker: "extension/src/background/index.ts",
    type: "module"
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["extension/src/content/index.ts"],
      run_at: "document_idle",
      all_frames: true,
      match_about_blank: true
    }
  ],
  host_permissions: ["<all_urls>"],
  web_accessible_resources: [
    { resources: ["auth-callback.html", "preview.html"], matches: ["<all_urls>"] }
  ]
});
