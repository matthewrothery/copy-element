import React from "react";
import { createRoot } from "react-dom/client";
import { LibraryApp } from "./App";
import "../popup/styles.css";
import "./styles.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container not found.");
}

createRoot(container).render(
  <React.StrictMode>
    <LibraryApp />
  </React.StrictMode>
);
