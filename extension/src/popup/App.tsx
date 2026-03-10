import { useEffect, useMemo, useState, type JSX } from "react";
import {
  deleteSnippetFromBackground,
  formatCaptureStartError,
  getSnippetsFromBackground,
  startCapture
} from "./api";
import { EmptyState } from "./components/EmptyState";
import { Header } from "./components/Header";
import { SnippetLibrary } from "./components/SnippetLibrary";
import { SnippetPreview } from "./components/SnippetPreview";
import { Toast } from "./components/Toast";
import type { Snippet } from "../shared/types/snippet";

function copyToClipboard(value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) {
        resolve();
      } else {
        reject(new Error("Copy failed"));
      }
    } catch (err) {
      document.body.removeChild(textarea);
      reject(err);
    }
  });
}

export function App(): JSX.Element {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  const hasSnippets = useMemo(() => snippets.length > 0, [snippets.length]);

  useEffect(() => {
    void loadSnippets();
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
      await startCapture();
      setToastMessage("Select an element on the page");
    } catch (error: unknown) {
      setToastMessage(formatCaptureStartError(error));
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
      <Header onCapture={() => void handleCapture()} />
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

      {selectedSnippet && (
        <SnippetPreview snippet={selectedSnippet} onClose={() => setSelectedSnippet(null)} onCopy={(value, label) => void handleCopy(value, label)} />
      )}
      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}
