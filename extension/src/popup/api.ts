import { nanoid } from "nanoid";
import type { CapturedElementData, Snippet } from "../shared/types/snippet";

interface RuntimeResponse<T> {
  ok: boolean;
  payload?: T;
  error?: string;
}

async function sendRuntimeMessage<T>(message: { type: string; payload?: unknown }): Promise<T> {
  const response = (await chrome.runtime.sendMessage(message)) as RuntimeResponse<T>;
  if (!response?.ok) {
    throw new Error(response?.error ?? "Unknown runtime error.");
  }
  return response.payload as T;
}

export async function startCapture(): Promise<void> {
  await sendRuntimeMessage<void>({ type: "START_CAPTURE" });
}

export async function getLatestCapture(): Promise<CapturedElementData | null> {
  return sendRuntimeMessage<CapturedElementData | null>({ type: "GET_LATEST_CAPTURE" });
}

export async function getSnippetsFromBackground(): Promise<Snippet[]> {
  return sendRuntimeMessage<Snippet[]>({ type: "GET_SNIPPETS" });
}

export async function saveSnippetFromCapture(
  capture: CapturedElementData,
  title: string,
  sourceUrl: string,
  thumbnail: string
): Promise<Snippet> {
  const snippet: Snippet = {
    id: nanoid(),
    title,
    sourceUrl,
    html: capture.html,
    jsx: capture.jsx,
    thumbnail,
    createdAt: Date.now(),
    width: capture.width,
    height: capture.height
  };

  await sendRuntimeMessage<void>({ type: "SAVE_SNIPPET", payload: snippet });
  return snippet;
}

export async function deleteSnippetFromBackground(id: string): Promise<void> {
  await sendRuntimeMessage<void>({ type: "DELETE_SNIPPET", payload: { id } });
}
