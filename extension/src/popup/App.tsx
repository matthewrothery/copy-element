import { useEffect, useMemo, useState, type JSX } from "react";
import {
  deleteSnippetFromBackground,
  formatCaptureStartError,
  getLatestCapture,
  getSnippetsFromBackground,
  saveSnippetFromCapture,
  startCapture
} from "./api";
import { CaptureModal } from "./components/CaptureModal";
import { EmptyState } from "./components/EmptyState";
import { Header } from "./components/Header";
import { SnippetLibrary } from "./components/SnippetLibrary";
import { SnippetPreview } from "./components/SnippetPreview";
import { Toast } from "./components/Toast";
import type { CapturedElementData, Snippet } from "../shared/types/snippet";
import { getCaptureThumbnail } from "./thumbnail";

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

async function copyToClipboard(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}

export function App(): JSX.Element {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [captureData, setCaptureData] = useState<CapturedElementData | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const hasSnippets = useMemo(() => snippets.length > 0, [snippets.length]);

  useEffect(() => {
    void loadSnippets();
  }, []);

  useEffect(() => {
    void getLatestCapture().then((capture) => {
      if (capture) {
        setCaptureData(capture);
        setIsCapturing(false);
      }
    });
  }, []);

  useEffect(() => {
    const listener = (message: { type?: string; payload?: unknown }): void => {
      if (message.type === "CAPTURE_READY") {
        setCaptureData(message.payload as CapturedElementData);
        setIsCapturing(false);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToastMessage(""), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  async function loadSnippets(): Promise<void> {
    try {
      const data = await getSnippetsFromBackground();
      setSnippets(data);
    } catch {
      setToastMessage("Failed to load snippets");
    }
  }

  async function handleCapture(): Promise<void> {
    try {
      setIsCapturing(true);
      await startCapture();
      setToastMessage("Select an element on the page");
    } catch (error: unknown) {
      setIsCapturing(false);
      setToastMessage(formatCaptureStartError(error));
    }
  }

  async function handleSaveCapture(): Promise<void> {
    if (!captureData) {
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const sourceUrl = tab?.url ?? "about:blank";
      const title = `${captureData.elementLabel} - ${getDomain(sourceUrl)}`;
      const snippetWithThumbnail: CapturedElementData = {
        ...captureData,
        thumbnail: getCaptureThumbnail(captureData)
      };
      const snippet = await saveSnippetFromCapture(snippetWithThumbnail, title, sourceUrl);
      setSnippets((prev) => [snippet, ...prev]);
      setCaptureData(null);
      setToastMessage("Snippet saved");
    } catch {
      setToastMessage("Failed to save snippet");
    }
  }

  async function handleDeleteSnippet(id: string): Promise<void> {
    try {
      await deleteSnippetFromBackground(id);
      setSnippets((prev) => prev.filter((snippet) => snippet.id !== id));
      setToastMessage("Snippet deleted");
    } catch {
      setToastMessage("Failed to delete snippet");
    }
  }

  async function handleCopy(value: string, label: string): Promise<void> {
    try {
      await copyToClipboard(value);
      setToastMessage(`${label} copied to clipboard`);
    } catch {
      setToastMessage(`Failed to copy ${label}`);
    }
  }

  return (
    <div className="app-shell">
      <Header onCapture={() => void handleCapture()} isCapturing={isCapturing} />
      <main className="main-content">
        {hasSnippets ? (
          <SnippetLibrary
            snippets={snippets}
            onOpen={setSelectedSnippet}
            onDelete={(id) => void handleDeleteSnippet(id)}
            onCopy={(value, label) => void handleCopy(value, label)}
          />
        ) : (
          <EmptyState onCapture={() => void handleCapture()} />
        )}
      </main>
      <footer className="footer">
        <span>Settings</span>
        <span>Help</span>
        <span>v0.1.0</span>
      </footer>

      {captureData && <CaptureModal capture={captureData} onSave={() => void handleSaveCapture()} onCancel={() => setCaptureData(null)} />}
      {selectedSnippet && (
        <SnippetPreview snippet={selectedSnippet} onClose={() => setSelectedSnippet(null)} onCopy={(value, label) => void handleCopy(value, label)} />
      )}
      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}
