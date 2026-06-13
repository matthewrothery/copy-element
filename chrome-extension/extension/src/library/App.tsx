import { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import { nanoid } from "nanoid";
import { trackPopupEvent } from "../shared/analytics";
import {
  deleteFolderFromBackground,
  deleteSnippetFromBackground,
  getFoldersFromBackground,
  getInstallIdFromBackground,
  getSnippetsFromBackground,
  openSignInPage,
  openUpgradePage,
  retryAllSyncs,
  retrySnippetSync,
  saveFolderToBackground,
  saveSnippetToBackground
} from "../popup/api";
import { useAuthState } from "../app/shared/hooks/useAuthState";
import { useCaptureSyncStatus } from "../app/shared/hooks/useCaptureSyncStatus";
import { DeleteConfirmationModal } from "../popup/components/DeleteConfirmationModal";
import { SignInPromoModal } from "../popup/components/SignInPromoModal";
import { UpgradePromoModal } from "../popup/components/UpgradePromoModal";
import { EmptyState } from "../popup/components/EmptyState";
import { FolderCard } from "../popup/components/FolderCard";
import { FolderDeleteConfirmationModal } from "../popup/components/FolderDeleteConfirmationModal";
import { LibraryBreadcrumb } from "../popup/components/LibraryBreadcrumb";
import { NewFolderModal } from "../popup/components/NewFolderModal";
import { RenameFolderModal } from "../popup/components/RenameFolderModal";
import { SnippetLibrary } from "../popup/components/SnippetLibrary";
import { SnippetPreview } from "../popup/components/SnippetPreview";
import { Toast } from "../popup/components/Toast";
import type { Folder } from "../shared/types/folder";
import type { Snippet } from "../shared/types/snippet";
import { buildSnippetPrompt } from "../shared/utils/prompt-builder";
import { PAID_PLANS } from "../shared/usage";
import {
  getGuestPromptCount,
  incrementGuestPromptCount,
  GUEST_PROMPT_LIMIT
} from "../shared/storage/guest-prompt-counter";

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
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [snippetToDelete, setSnippetToDelete] = useState<Snippet | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { signedIn, userPlan } = useAuthState();
  const isGuest = !signedIn;
  const isPaid = signedIn && PAID_PLANS.includes(userPlan as never);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoModalVariant, setPromoModalVariant] = useState<"default" | "limit-reached">("default");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"date-desc" | "date-asc" | "name-asc" | "name-desc">("date-desc");

  const foldersById = useMemo(() => {
    const map = new Map<string, Folder>();
    for (const f of folders) {
      map.set(f.id, f);
    }
    return map;
  }, [folders]);

  const currentFolder = currentFolderId ? foldersById.get(currentFolderId) ?? null : null;

  const childFolders = useMemo(
    () => folders.filter((f) => f.parentId === currentFolderId),
    [folders, currentFolderId]
  );

  const snippetsInCurrentFolder = useMemo(() => {
    return snippets.filter((s) => (s.folderId ?? null) === currentFolderId);
  }, [snippets, currentFolderId]);

  const filteredSnippets = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const filtered = !trimmed
      ? snippetsInCurrentFolder
      : snippetsInCurrentFolder.filter((snippet) => {
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

    return [...filtered].sort((a, b) => {
      switch (sortOrder) {
        case "date-asc":
          return a.createdAt - b.createdAt;
        case "name-asc":
          return a.title.localeCompare(b.title);
        case "name-desc":
          return b.title.localeCompare(a.title);
        case "date-desc":
        default:
          return b.createdAt - a.createdAt;
      }
    });
  }, [query, snippetsInCurrentFolder, sortOrder]);

  const hasSnippets = filteredSnippets.length > 0;
  const hasFolders = childFolders.length > 0;
  const isEmpty = !hasSnippets && !hasFolders;

  const loadData = useCallback(async () => {
    try {
      const [snippetData, folderData] = await Promise.all([
        getSnippetsFromBackground(),
        getFoldersFromBackground()
      ]);
      setSnippets(snippetData);
      setFolders(folderData);
      const snippetId = new URL(window.location.href).searchParams.get("snippet");
      if (snippetId) {
        const snippet = snippetData.find((s) => s.id === snippetId);
        if (snippet) {
          setSelectedSnippet(snippet);
          if (snippet.folderId) {
            setCurrentFolderId(snippet.folderId);
          }
        }
      }
    } catch {
      setToastMessage("Failed to load library");
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage?.onChanged?.addListener) return;
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ): void => {
      if (areaName === "local" && "element-capture-snippet-ids" in changes) {
        void loadData();
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [loadData]);

  // Track library opened
  useEffect(() => {
    void trackPopupEvent('library_viewed');
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timeoutId = window.setTimeout(() => setToastMessage(""), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  // Post-sign-in capture sync (start/done) surfaces as a toast if this view is open.
  const syncStatus = useCaptureSyncStatus();
  useEffect(() => {
    if (syncStatus.message) setToastMessage(syncStatus.message);
  }, [syncStatus.message]);

  async function handleDeleteSnippet(id: string): Promise<void> {
    try {
      await deleteSnippetFromBackground(id);
      setSnippets((prev) => prev.filter((s) => s.id !== id));
      setSelectedSnippet((prev) => (prev?.id === id ? null : prev));
      setSnippetToDelete(null);
      setToastMessage("Snippet deleted");
    } catch {
      setToastMessage("Failed to delete snippet");
    }
  }

  async function handleRetrySync(id: string): Promise<void> {
    try {
      const { syncStatus: result } = await retrySnippetSync(id);
      setSnippets((prev) => prev.map((s) => (s.id === id ? { ...s, syncStatus: result } : s)));
      setToastMessage(result === "synced" ? "Capture synced" : "Sync failed — try again later");
    } catch {
      setToastMessage("Sync failed — try again later");
    }
  }

  async function handleRetryAllSyncs(): Promise<void> {
    try {
      await retryAllSyncs();
    } catch {
      setToastMessage("Failed to resync captures");
    }
  }

  async function handleDeleteFolder(folder: Folder): Promise<void> {
    try {
      await deleteFolderFromBackground(folder.id);
      setFolderToDelete(null);
      void loadData();
      setToastMessage("Folder deleted");
    } catch {
      setToastMessage("Failed to delete folder");
    }
  }

  async function handleRenameFolder(folder: Folder, name: string): Promise<void> {
    try {
      await saveFolderToBackground({ ...folder, name });
      setFolderToRename(null);
      setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, name } : f)));
      setToastMessage("Folder renamed");
    } catch {
      setToastMessage("Failed to rename folder");
    }
  }

  async function handleCreateFolder(name: string): Promise<void> {
    try {
      const folder: Folder = {
        id: nanoid(),
        name,
        parentId: currentFolderId,
        createdAt: Date.now()
      };
      await saveFolderToBackground(folder);
      setShowNewFolder(false);
      setFolders((prev) => [...prev, folder]);
      setToastMessage("Folder created");
    } catch {
      setToastMessage("Failed to create folder");
    }
  }

  function snippetCountForFolder(folderId: string): number {
    return snippets.filter((s) => (s.folderId ?? null) === folderId).length;
  }

  function subfolderCountForFolder(folderId: string): number {
    return folders.filter((f) => f.parentId === folderId).length;
  }

  async function handleCopyPromptAsGuest(snippet: Snippet): Promise<void> {
    const count = await getGuestPromptCount();

    if (count >= GUEST_PROMPT_LIMIT) {
      setPromoModalVariant("limit-reached");
      setShowPromoModal(true);
      void trackPopupEvent('guest_prompt_limit_shown');
      return;
    }

    try {
      await copyToClipboard(buildSnippetPrompt(snippet));
      const newCount = await incrementGuestPromptCount();
      void trackPopupEvent('element_exported', { format: 'prompt_basic', tier: 'guest' });

      const remaining = GUEST_PROMPT_LIMIT - newCount;
      if (remaining > 0) {
        setToastMessage(`Prompt copied · ${remaining} free ${remaining === 1 ? "copy" : "copies"} left`);
      } else {
        setToastMessage("Prompt copied");
        setPromoModalVariant("limit-reached");
        setShowPromoModal(true);
        void trackPopupEvent('guest_prompt_limit_shown');
      }
    } catch {
      setToastMessage("Failed to copy prompt");
    }
  }

  async function handleCopyPromptAsFree(snippet: Snippet): Promise<void> {
    try {
      await copyToClipboard(buildSnippetPrompt(snippet));
      setToastMessage("Prompt copied");
      void trackPopupEvent('element_exported', { format: 'prompt_basic' });
    } catch {
      setToastMessage("Failed to copy prompt");
    }
    setShowUpgradeModal(true);
  }

  async function handleCopy(value: string, label: string): Promise<void> {
    try {
      await copyToClipboard(value);
      setToastMessage(`${label} copied to clipboard`);
      const format = label.toLowerCase().includes('html') || label.toLowerCase().includes('code') ? 'html' : 'other';
      void trackPopupEvent('element_exported', { format });
    } catch {
      setToastMessage(`Failed to copy ${label}`);
    }
  }

  async function handleMoveSnippet(snippetId: string, targetFolderId: string | null): Promise<void> {
    const snippet = snippets.find((s) => s.id === snippetId);
    if (!snippet) return;
    try {
      await saveSnippetToBackground({ ...snippet, folderId: targetFolderId });
      setSnippets((prev) =>
        prev.map((s) => (s.id === snippetId ? { ...s, folderId: targetFolderId } : s))
      );
      setToastMessage("Snippet moved");
    } catch {
      setToastMessage("Failed to move snippet");
    }
  }

  function isDescendant(
    foldersById: Map<string, Folder>,
    folderId: string,
    potentialAncestorId: string
  ): boolean {
    let current: Folder | undefined = foldersById.get(folderId);
    while (current?.parentId) {
      if (current.parentId === potentialAncestorId) return true;
      current = foldersById.get(current.parentId);
    }
    return false;
  }

  async function handleMoveFolder(folderId: string, targetParentId: string | null): Promise<void> {
    if (targetParentId === folderId) return;
    if (targetParentId !== null && isDescendant(foldersById, targetParentId, folderId)) return;
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;
    try {
      await saveFolderToBackground({ ...folder, parentId: targetParentId });
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, parentId: targetParentId } : f))
      );
      setToastMessage("Folder moved");
    } catch {
      setToastMessage("Failed to move folder");
    }
  }

  const subtitle =
    currentFolderId === null
      ? `${snippets.length} saved snippets`
      : `${snippetsInCurrentFolder.length} snippet${snippetsInCurrentFolder.length === 1 ? "" : "s"} in this folder`;

  const hasFailedSyncs = !isGuest && snippets.some((s) => s.syncStatus === "failed");

  return (
    <div className="app-shell library-shell">
      <header className="library-header">
        {/* <img src={logoUrl} alt="" width={32} height={32} style={{ objectFit: "contain" }} /> */}
        <div className="library-header-copy">
          <h1 className="library-header-title">Library</h1>
          <p className="library-header-subtitle">{subtitle}</p>
        </div>
        <input
          type="search"
          className="library-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or domain"
          aria-label="Search snippets"
        />
        <select
          className="library-sort"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
          aria-label="Sort snippets"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
        </select>
        {hasFailedSyncs && (
          <button
            type="button"
            className="btn-secondary library-resync-btn"
            onClick={() => void handleRetryAllSyncs()}
          >
            Resync all
          </button>
        )}
        <button
          type="button"
          className="btn-primary library-new-folder-btn"
          onClick={() => setShowNewFolder(true)}
        >
          New folder
        </button>
      </header>
      <main className="main-content">
        <LibraryBreadcrumb
          currentFolder={currentFolder}
          foldersById={foldersById}
          onNavigate={setCurrentFolderId}
          onDropSnippet={(id) => void handleMoveSnippet(id, null)}
          onDropFolder={(id) => void handleMoveFolder(id, null)}
        />
        {hasFolders && (
          <section className="library-folders-section" aria-label="Folders">
            <h2 className="library-folders-title">Folders</h2>
            <div className="library-folders-grid">
              {childFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  snippetCount={snippetCountForFolder(folder.id)}
                  subfolderCount={subfolderCountForFolder(folder.id)}
                  onOpen={(f) => setCurrentFolderId(f.id)}
                  onRename={setFolderToRename}
                  onDelete={setFolderToDelete}
                  onDropSnippet={(id) => void handleMoveSnippet(id, folder.id)}
                  onDropFolder={(id) => void handleMoveFolder(id, folder.id)}
                />
              ))}
            </div>
          </section>
        )}
        {hasSnippets ? (
          <section className="library-snippets-section" aria-label="Snippets">
            {hasFolders && <h2 className="library-folders-title">Snippets</h2>}
            <SnippetLibrary
              snippets={filteredSnippets}
              onOpen={setSelectedSnippet}
              onDelete={(id) => {
                const s = snippets.find((x) => x.id === id);
                if (s) setSnippetToDelete(s);
              }}
              onCopy={(value, label) => void handleCopy(value, label)}
              isGuest={isGuest}
              onCopyPromptAsGuest={(snippet) => void handleCopyPromptAsGuest(snippet)}
              isFree={!isGuest && !isPaid}
              onCopyPromptAsFree={(snippet) => void handleCopyPromptAsFree(snippet)}
              showSyncStatus={!isGuest}
              onRetrySync={(id) => void handleRetrySync(id)}
            />
          </section>
        ) : snippets.length > 0 ? (
          <div className="empty-state">
            <h2>No matching snippets</h2>
            <p>Try a different search term.</p>
          </div>
        ) : isEmpty ? (
          <EmptyState onCapture={() => {}} showCaptureButton={false} />
        ) : null}
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
      {folderToDelete && (
        <FolderDeleteConfirmationModal
          folder={folderToDelete}
          onConfirm={() => void handleDeleteFolder(folderToDelete)}
          onCancel={() => setFolderToDelete(null)}
        />
      )}
      {folderToRename && (
        <RenameFolderModal
          folder={folderToRename}
          onSave={(name) => void handleRenameFolder(folderToRename, name)}
          onCancel={() => setFolderToRename(null)}
        />
      )}
      {showNewFolder && (
        <NewFolderModal
          parentFolderId={currentFolderId}
          onCreate={(name) => void handleCreateFolder(name)}
          onCancel={() => setShowNewFolder(false)}
        />
      )}
      {showUpgradeModal && (
        <UpgradePromoModal
          onUpgrade={() => { openUpgradePage(); setShowUpgradeModal(false); }}
          onClose={() => setShowUpgradeModal(false)}
          onShown={() => void trackPopupEvent('upgrade_modal_shown', { source: 'library' })}
        />
      )}
      {showPromoModal && (
        <SignInPromoModal
          variant={promoModalVariant}
          onSignIn={() => {
            setShowPromoModal(false);
            void getInstallIdFromBackground().then(openSignInPage).catch(() => {});
          }}
          onClose={() => setShowPromoModal(false)}
          onShown={() => void trackPopupEvent('signin_modal_shown', { source: 'library' })}
        />
      )}
      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}
