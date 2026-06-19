import React from "react";
import { createRoot } from "react-dom/client";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import "../styles/tokens/index.css";
import "../styles/base.css";
import "./styles.css";
import { App } from "./App";

// Must be defined before any Monaco editor instance is created
(self as Window & { MonacoEnvironment?: unknown }).MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new htmlWorker();
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker();
    }
    return new editorWorker();
  }
};

const container = document.getElementById("root");
if (!container) throw new Error("Root container not found.");

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
