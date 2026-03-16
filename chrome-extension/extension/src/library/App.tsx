import { useEffect, useMemo, useState, type JSX } from "react";
import {
  deleteSnippetFromBackground,
  getSnippetsFromBackground
} from "../popup/api";
import { DeleteConfirmationModal } from "../popup/components/DeleteConfirmationModal";
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
  const [snippetToDelete, setSnippetToDelete] = useState<Snippet | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [query, setQuery] = useState("");

  const filteredSnippets = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return snippets;
    }
    return snippets.filter((snippet) => {
      const domain = (() => {
        try {
          return new URL(snippet.sourceUrl).hostname;
        } catch {
          return snippet.sourceUrl;
        }
      })();
      return (
        snippet.title.toLowerCase().includes(trimmed) ||
        domain.toLowerCase().includes(trimmed)
      );
    });
  }, [query, snippets]);
  const hasSnippets = useMemo(() => filteredSnippets.length > 0, [filteredSnippets.length]);

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
      const snippetId = new URL(window.location.href).searchParams.get("snippet");
      if (snippetId) {
        const snippet = data.find((s) => s.id === snippetId);
        if (snippet) {
          setSelectedSnippet(snippet);
        }
      }
    } catch {
      setToastMessage("Failed to load snippets");
    }
  }

  async function handleDeleteSnippet(id: string): Promise<void> {
    try {
      await deleteSnippetFromBackground(id);
      setSnippets((prev) => prev.filter((snippet) => snippet.id !== id));
      setSelectedSnippet((prev) => (prev?.id === id ? null : prev));
      setSnippetToDelete(null);
      setToastMessage("Snippet deleted");
    } catch {
      setToastMessage("Failed to delete snippet");
    }
  }

  function handleDeleteClick(id: string): void {
    const snippet = snippets.find((s) => s.id === id);
    if (snippet) {
      setSnippetToDelete(snippet);
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
        <div className="library-header-copy">
          <h1 className="library-header-title">Element Armory - Library</h1>
          <p className="library-header-subtitle">{snippets.length} saved snippets</p>
        </div>
        <input
          type="search"
          className="library-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title or domain"
          aria-label="Search snippets"
        />
      </header>
      <main className="main-content">
        {hasSnippets ? (
          <SnippetLibrary
            snippets={filteredSnippets}
            onOpen={setSelectedSnippet}
            onDelete={handleDeleteClick}
            onCopy={(value, label) => void handleCopy(value, label)}
          />
        ) : snippets.length > 0 ? (
          <div className="empty-state">
            <h2>No matching snippets</h2>
            <p>Try a different search term.</p>
          </div>
        ) : (
          <EmptyState onCapture={() => {}} showCaptureButton={false} />
        )}
      </main>

      {selectedSnippet && (
        <SnippetPreview
          snippet={selectedSnippet}
          onClose={() => setSelectedSnippet(null)}
          onCopy={(value, label) => void handleCopy(value, label)}
          onToast={setToastMessage}
        />
      )}
      {snippetToDelete && (
        <DeleteConfirmationModal
          snippetTitle={snippetToDelete.title}
          onConfirm={() => void handleDeleteSnippet(snippetToDelete.id)}
          onCancel={() => setSnippetToDelete(null)}
        />
      )}
      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}
