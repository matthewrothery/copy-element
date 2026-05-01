import { existsSync, unlinkSync, writeFileSync } from "fs";
import path from "path";
import { mkdirSync } from "fs";

export type AutoBloggerLock = {
  release: () => void;
};

export function acquireLock(lockPath: string): AutoBloggerLock {
  mkdirSync(path.dirname(lockPath), { recursive: true });
  if (existsSync(lockPath)) {
    throw new Error(`Lock already exists at ${lockPath}`);
  }

  writeFileSync(lockPath, String(process.pid), "utf-8");

  return {
    release: () => {
      if (existsSync(lockPath)) {
        unlinkSync(lockPath);
      }
    },
  };
}
