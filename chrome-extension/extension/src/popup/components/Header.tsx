import logoUrl from "../../../assets/logo.png";
import type React from "react";
import type { CaptureMode } from "../../shared/types/messages";
import { CaptureButton } from "./CaptureButton";

interface HeaderProps {
  onCapture: (mode: CaptureMode) => void;
  defaultCaptureMode: CaptureMode;
  captureDisabled?: boolean;
  onLibrary: () => void;
  onToggleSettings: () => void;
  isSettingsView: boolean;
  children: React.ReactNode;
}

export function Header({ onCapture, defaultCaptureMode, captureDisabled, isSettingsView, children }: HeaderProps): React.ReactElement {
  return (
    <header className="header">
      <div className="header-brand">
        <img src={logoUrl} alt="" className="header-logo" width={32} height={32} />
        <div className="header-brand-copy">
          <h1 className="header-title">Element Armory</h1>
          <p className="header-subtitle">Capture UI from any site and rebuild it with AI.</p>
        </div>
      </div>
      {!isSettingsView && (
        <>
          {children}
          <nav className="nav-buttons">
            <CaptureButton
              defaultMode={defaultCaptureMode}
              onCapture={onCapture}
              disabled={captureDisabled}
            />
          </nav>
        </>
      )}
    </header>
  );
}
