import type React from "react";
import type { JSX } from "react";
import logoUrl from "../../../assets/logo.png";

interface HeaderProps {
  onCapture: () => void;
  onLibrary: () => void;
  onToggleSettings: () => void;
  isSettingsView: boolean;
}

export function Header({ onCapture, onLibrary, onToggleSettings, isSettingsView }: HeaderProps): JSX.Element {
  return (
    <header className="header">
      <div className="header-brand">
        <img src={logoUrl} alt="" className="header-logo" width={32} height={32} />
        <div className="header-brand-copy">
          <h1 className="header-title">Element Armory</h1>
          <p className="header-subtitle">Capture UI from any site and rebuild it with AI.</p>
        </div>
      </div>
      <nav className="nav-buttons">
        <button
          className="nav-button nav-button-primary"
          onClick={onCapture}
          type="button"
          aria-label="Capture Element"
        >
          Capture Element
        </button>
        <button
          className="nav-button"
          onClick={onLibrary}
          type="button"
          aria-label="Open Library"
        >
          Open Library
        </button>
        <button
          className="nav-button nav-button-ghost"
          onClick={onToggleSettings}
          type="button"
          aria-label={isSettingsView ? "Close settings" : "Open settings"}
        >
          {isSettingsView ? "Close Settings" : "Settings"}
        </button>
      </nav>
    </header>
  );
}
