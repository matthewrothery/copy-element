import { ChevronLeft } from "lucide-react";
import type { JSX } from "react";

export interface UiPreferences {
  thumbnailSize: "compact" | "balanced" | "detailed";
  assetReplacementMode: "smart" | "preserve" | "placeholder";
  exportFormat: "html" | "html-inline" | "jsx";
}

interface SettingsPanelProps {
  preferences: UiPreferences;
  onChange: (next: UiPreferences) => void;
  onBack?: () => void;
}

const BACK_ICON_SIZE = 20;

export function SettingsPanel({ preferences, onChange, onBack }: SettingsPanelProps): JSX.Element {
  return (
    <section className="settings-panel" aria-label="Extension settings">
      <div className="settings-header">
        {onBack && (
          <button
            type="button"
            className="settings-back-button"
            onClick={onBack}
            aria-label="Back to main"
          >
            <ChevronLeft size={BACK_ICON_SIZE} aria-hidden />
          </button>
        )}
        <h2 className="settings-title">Settings</h2>
      </div>
      <p className="settings-description">These preferences tune capture and export defaults for your workflow.</p>

      <div className="settings-section">
        <h3 className="settings-section-title">Thumbnail size</h3>
        <p className="settings-description">Controls preview density in the snippet library.</p>
        <div className="settings-controls">
          <button
            type="button"
            className={`settings-chip ${preferences.thumbnailSize === "compact" ? "settings-chip-active" : ""}`}
            onClick={() => onChange({ ...preferences, thumbnailSize: "compact" })}
            aria-label="Use compact thumbnails"
          >
            Compact
          </button>
          <button
            type="button"
            className={`settings-chip ${preferences.thumbnailSize === "balanced" ? "settings-chip-active" : ""}`}
            onClick={() => onChange({ ...preferences, thumbnailSize: "balanced" })}
            aria-label="Use balanced thumbnails"
          >
            Balanced
          </button>
          <button
            type="button"
            className={`settings-chip ${preferences.thumbnailSize === "detailed" ? "settings-chip-active" : ""}`}
            onClick={() => onChange({ ...preferences, thumbnailSize: "detailed" })}
            aria-label="Use detailed thumbnails"
          >
            Detailed
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Asset replacement mode</h3>
        <p className="settings-description">Choose how external assets are handled in captured snippets.</p>
        <div className="settings-controls">
          <button
            type="button"
            className={`settings-chip ${preferences.assetReplacementMode === "smart" ? "settings-chip-active" : ""}`}
            onClick={() => onChange({ ...preferences, assetReplacementMode: "smart" })}
            aria-label="Use smart asset replacement"
          >
            Smart
          </button>
          <button
            type="button"
            className={`settings-chip ${preferences.assetReplacementMode === "preserve" ? "settings-chip-active" : ""}`}
            onClick={() => onChange({ ...preferences, assetReplacementMode: "preserve" })}
            aria-label="Preserve assets when possible"
          >
            Preserve
          </button>
          <button
            type="button"
            className={`settings-chip ${preferences.assetReplacementMode === "placeholder" ? "settings-chip-active" : ""}`}
            onClick={() => onChange({ ...preferences, assetReplacementMode: "placeholder" })}
            aria-label="Use placeholders for assets"
          >
            Placeholder
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Default export format</h3>
        <p className="settings-description">Sets the default format highlighted in preview/copy workflows.</p>
        <div className="settings-controls">
          <button
            type="button"
            className={`settings-chip ${preferences.exportFormat === "html" ? "settings-chip-active" : ""}`}
            onClick={() => onChange({ ...preferences, exportFormat: "html" })}
            aria-label="Default to HTML export"
          >
            HTML
          </button>
          <button
            type="button"
            className={`settings-chip ${preferences.exportFormat === "html-inline" ? "settings-chip-active" : ""}`}
            onClick={() => onChange({ ...preferences, exportFormat: "html-inline" })}
            aria-label="Default to inline HTML export"
          >
            Inline
          </button>
          <button
            type="button"
            className={`settings-chip ${preferences.exportFormat === "jsx" ? "settings-chip-active" : ""}`}
            onClick={() => onChange({ ...preferences, exportFormat: "jsx" })}
            aria-label="Default to JSX export"
          >
            JSX
          </button>
        </div>
      </div>
    </section>
  );
}
