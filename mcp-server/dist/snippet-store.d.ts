import type { SnippetRecord } from "./types.js";
export declare function ensureStoreDir(): Promise<void>;
export declare function readSnippets(): Promise<SnippetRecord[]>;
export declare function writeSnippets(snippets: SnippetRecord[]): Promise<void>;
export declare function getSnippetById(id: string): Promise<SnippetRecord | null>;
