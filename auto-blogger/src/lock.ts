import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import path from "path";
import { mkdirSync } from "fs";

export type AutoBloggerLock = {
  release: () => void;
};

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function acquireLock(lockPath: string): AutoBloggerLock {
  mkdirSync(path.dirname(lockPath), { recursive: true });

  if (existsSync(lockPath)) {
    const raw = readFileSync(lockPath, "utf-8").trim();
    const pid = parseInt(raw, 10);
    if (!isNaN(pid) && isProcessRunning(pid)) {
      throw new Error(`Lock already exists at ${lockPath} (held by PID ${pid})`);
    }
    console.warn(`Removing stale lock at ${lockPath} (PID ${pid} is no longer running)`);
    unlinkSync(lockPath);
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
