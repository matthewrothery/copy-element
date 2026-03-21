import React from "react";
import type { Snippet } from "../../shared/types/snippet";
import { SnippetCard } from "./SnippetCard";

interface SnippetLibraryProps {
  snippets: Snippet[];
  onOpen: (snippet: Snippet) => void;
  onDelete: (id: string) => void;
  onCopy: (value: string, label: string) => void;
  isGuest?: boolean;
  onCopyPromptAsGuest?: (snippet: Snippet) => void;
  isFree?: boolean;
  onCopyPromptAsFree?: (snippet: Snippet) => void;
}

export function SnippetLibrary({ snippets, onOpen, onDelete, onCopy, isGuest, onCopyPromptAsGuest, isFree, onCopyPromptAsFree }: SnippetLibraryProps): React.ReactElement {
  return (
    <section className="snippet-grid" aria-label="Snippet library">
      {snippets.map((snippet) => (
        <SnippetCard
          key={snippet.id}
          snippet={snippet}
          onOpen={onOpen}
          onDelete={onDelete}
          onCopy={onCopy}
          isGuest={isGuest}
          onCopyPromptAsGuest={onCopyPromptAsGuest ? () => onCopyPromptAsGuest(snippet) : undefined}
          isFree={isFree}
          onCopyPromptAsFree={onCopyPromptAsFree ? () => onCopyPromptAsFree(snippet) : undefined}
        />
      ))}
    </section>
  );
}
