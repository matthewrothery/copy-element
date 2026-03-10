import { useEffect, useState, type JSX } from "react";
import {
  formatCaptureStartError,
  openLibraryInNewTab,
  startCapture
} from "./api";
import { Header } from "./components/Header";
import { Toast } from "./components/Toast";

export function App(): JSX.Element {
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToastMessage(""), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  async function handleCapture(): Promise<void> {
    try {
      await startCapture();
      window.close();
    } catch (error: unknown) {
      setToastMessage(formatCaptureStartError(error));
    }
  }

  function handleLibrary(): void {
    openLibraryInNewTab();
  }

  return (
    <div className="app-shell">
      <Header
        onCapture={() => void handleCapture()}
        onLibrary={handleLibrary}
      />
      <main className="main-content">
        <p className="popup-hint">Click Capture to select an element, or Library to view saved snippets.</p>
      </main>
      <footer className="footer">
        <span>Settings</span>
        <span>Help</span>
        <span>v0.1.0</span>
      </footer>

      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}
