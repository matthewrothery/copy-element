import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Element Capture",
  description: "Capture and save styled page elements as reusable snippets.",
  version: "0.1.0",
  permissions: ["activeTab", "storage", "scripting"],
  action: {
    default_title: "Element Capture",
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
      run_at: "document_idle"
    }
  ],
  host_permissions: ["<all_urls>"]
});
