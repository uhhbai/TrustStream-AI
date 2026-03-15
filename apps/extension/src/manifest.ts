import { defineManifest } from "@crxjs/vite-plugin";
import packageJson from "../package.json";

export default defineManifest({
  manifest_version: 3,
  name: "TrustStream AI",
  version: packageJson.version,
  description: "Real-time trust and scam-risk assistant for livestream commerce.",
  action: {
    default_popup: "src/popup/index.html",
    default_title: "TrustStream AI"
  },
  options_page: "src/popup/options.html",
  background: {
    service_worker: "src/background/index.ts",
    type: "module"
  },
  permissions: ["activeTab", "scripting", "storage", "tabs"],
  optional_permissions: ["tabCapture"],
  host_permissions: [
    "https://*/*",
    "http://*/*",
    "http://localhost:8787/*",
    "http://127.0.0.1:8787/*"
  ],
  content_scripts: [
    {
      matches: ["https://*/*", "http://*/*"],
      js: ["src/content/index.tsx"],
      run_at: "document_idle"
    }
  ]
});
