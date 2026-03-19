import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Element Armory",
  description: "Capture and save styled page elements as reusable snippets.",
  version: "0.1.0",
  permissions: ["activeTab", "tabs", "storage", "scripting", "clipboardWrite", "debugger", "webNavigation", "alarms"],
  action: {
    default_title: "Element Armory",
    default_popup: "popup.html"
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
