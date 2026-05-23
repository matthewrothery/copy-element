import { mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { StateStore } from "./stateStore.js";

type StateFile = {
  processedKeywordIds: string[];
  processedSlugs: string[];
  failedKeywordIds: string[];
  lastRunAt?: number;
  emailFailures: string[];
};


function emptyState(): StateFile {
  return {
    processedKeywordIds: [],
    processedSlugs: [],
    failedKeywordIds: [],
    emailFailures: [],
  };
}

function readState(statePath: string): StateFile {
  if (!existsSync(statePath)) return emptyState();
  try {
    const raw = readFileSync(statePath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<StateFile>;
    return {
      ...emptyState(),
      ...parsed,
      processedKeywordIds: parsed.processedKeywordIds ?? [],
      processedSlugs: parsed.processedSlugs ?? [],
      failedKeywordIds: parsed.failedKeywordIds ?? [],
      emailFailures: parsed.emailFailures ?? [],
    };
  } catch {
    return emptyState();
  }
}

function writeState(statePath: string, state: StateFile): void {
  mkdirSync(path.dirname(statePath), { recursive: true });
  writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n", "utf-8");
}

export class FilesystemStateStore implements StateStore {
  constructor(private readonly statePath: string) {}

  async claimKeyword(id: string, _requestId: string): Promise<boolean> {
    const state = readState(this.statePath);
    if (state.processedKeywordIds.includes(id)) return false;
    state.processedKeywordIds.push(id);
    writeState(this.statePath, state);
    return true;
  }

  async recordSlug(slug: string): Promise<boolean> {
    const state = readState(this.statePath);
    if (state.processedSlugs.includes(slug)) return false;
    state.processedSlugs.push(slug);
    writeState(this.statePath, state);
    return true;
  }

  async loadProcessedKeywordIds(): Promise<Set<string>> {
    return new Set(readState(this.statePath).processedKeywordIds);
  }

  async loadProcessedSlugs(): Promise<Set<string>> {
    return new Set(readState(this.statePath).processedSlugs);
  }

  async recordEmailFailure(artifactId: string): Promise<void> {
    const state = readState(this.statePath);
    if (!state.emailFailures.includes(artifactId)) {
      state.emailFailures.push(artifactId);
      writeState(this.statePath, state);
    }
  }

  async recordRun(timestamp: number): Promise<void> {
    const state = readState(this.statePath);
    state.lastRunAt = timestamp;
    writeState(this.statePath, state);
  }
}
