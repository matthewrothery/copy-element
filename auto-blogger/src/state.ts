import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { AutoBloggerState } from "./types.js";

const INITIAL_STATE: AutoBloggerState = {
  processedKeywordIds: [],
  processedSlugs: [],
  failedKeywordIds: [],
  emailFailures: [],
};

export function loadState(statePath: string): AutoBloggerState {
  if (!existsSync(statePath)) {
    return { ...INITIAL_STATE };
  }

  try {
    const raw = readFileSync(statePath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AutoBloggerState>;
    return {
      ...INITIAL_STATE,
      ...parsed,
      processedKeywordIds: parsed.processedKeywordIds ?? [],
      processedSlugs: parsed.processedSlugs ?? [],
      failedKeywordIds: parsed.failedKeywordIds ?? [],
      emailFailures: parsed.emailFailures ?? [],
    };
  } catch {
    return { ...INITIAL_STATE };
  }
}

export function saveState(statePath: string, state: AutoBloggerState): void {
  mkdirSync(path.dirname(statePath), { recursive: true });
  writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n", "utf-8");
}
