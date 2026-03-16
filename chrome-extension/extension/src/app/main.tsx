import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "../styles/tokens/index.css";
import "../styles/base.css";
import "../popup/styles.css";
import "../library/styles.css";
import "./styles.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container not found.");
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
