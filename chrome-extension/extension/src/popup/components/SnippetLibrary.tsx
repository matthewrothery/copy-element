import React from "react";
import type { Snippet } from "../../shared/types/snippet";
import type { PlanCode } from "../../shared/types/plan";
import { SnippetCard } from "./SnippetCard";

interface SnippetLibraryProps {
  snippets: Snippet[];
  plan: PlanCode;
  onOpen: (snippet: Snippet) => void;
  onDelete: (id: string) => void;
  onCopy: (value: string, label: string) => void;
}

export function SnippetLibrary({ snippets, plan, onOpen, onDelete, onCopy }: SnippetLibraryProps): React.ReactElement {
  return (
    <section className="snippet-grid" aria-label="Snippet library">
      {snippets.map((snippet) => (
        <SnippetCard key={snippet.id} snippet={snippet} plan={plan} onOpen={onOpen} onDelete={onDelete} onCopy={onCopy} />
      ))}
    </section>
  );
}
