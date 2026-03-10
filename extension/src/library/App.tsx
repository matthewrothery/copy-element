import { useEffect, useMemo, useState, type JSX } from "react";
import {
  deleteSnippetFromBackground,
  getSnippetsFromBackground
} from "../popup/api";
import { EmptyState } from "../popup/components/EmptyState";
import { SnippetLibrary } from "../popup/components/SnippetLibrary";
import { SnippetPreview } from "../popup/components/SnippetPreview";
import { Toast } from "../popup/components/Toast";
import type { Snippet } from "../shared/types/snippet";

import logoUrl from "../../assets/logo.png";

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

export function LibraryApp(): JSX.Element {
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

  async function handleDeleteSnippet(id: string): Promise<void> {
    try {
      await deleteSnippetFromBackground(id);
      setSnippets((prev) => prev.filter((snippet) => snippet.id !== id));
      setSelectedSnippet((prev) => (prev?.id === id ? null : prev));
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
    <div className="app-shell library-shell">
      <header className="library-header">
        <img src={logoUrl} alt="" width={32} height={32} style={{ objectFit: "contain" }} />
        <h1 className="library-header-title">SnappyMCP – Library</h1>
      </header>
      <main className="main-content">
        {hasSnippets ? (
          <SnippetLibrary
            snippets={snippets}
            onOpen={setSelectedSnippet}
            onDelete={(id) => void handleDeleteSnippet(id)}
            onCopy={(value, label) => void handleCopy(value, label)}
          />
        ) : (
          <EmptyState onCapture={() => {}} showCaptureButton={false} />
        )}
      </main>

      {selectedSnippet && (
        <SnippetPreview
          snippet={selectedSnippet}
          onClose={() => setSelectedSnippet(null)}
          onCopy={(value, label) => void handleCopy(value, label)}
        />
      )}
      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}
