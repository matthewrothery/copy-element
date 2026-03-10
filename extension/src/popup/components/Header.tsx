import type React from "react";
import type { JSX } from "react";
import logoUrl from "../../../assets/logo.png";

interface HeaderProps {
  onCapture: () => void;
  onLibrary: () => void;
  onMCP?: () => void;
}

export function Header({ onCapture, onLibrary, onMCP }: HeaderProps): JSX.Element {
  return (
    <header className="header">
      <div className="header-brand">
        <img src={logoUrl} alt="" className="header-logo" width={32} height={32} />
        <h1 className="header-title">SnappyMCP</h1>
      </div>
      <hr className="header-separator" />
      <nav className="nav-buttons">
        <button
          className="nav-button"
          onClick={onCapture}
          type="button"
          aria-label="Capture Element"
        >
          Capture
        </button>
        <button
          className="nav-button"
          onClick={onLibrary}
          type="button"
          aria-label="Open Library"
        >
          Library
        </button>
        <button
          className="nav-button"
          onClick={onMCP}
          type="button"
          aria-label="MCP"
        >
          MCP
        </button>
      </nav>
    </header>
  );
}
