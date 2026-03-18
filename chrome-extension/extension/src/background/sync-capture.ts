import type { Snippet } from "../shared/types/snippet";
import { getAuthToken, getOrCreateInstallCredentials } from "../shared/storage/auth-storage";
import { SERVER_URL } from "../shared/server-url";

interface AuthFields {
  install_id: string;
  install_secret: string;
}

interface AssetEntry {
  kind: string;
  bytes: Uint8Array;
  contentType: string;
}

interface PresignedUrlResult {
  url: string;
  object_key: string;
}

function thumbnailToBytes(dataUrl: string): { bytes: Uint8Array; contentType: string } | null {
  const match = /^data:(image\/(?:png|jpeg));base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1];
  const b64 = match[2];
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { bytes, contentType };
  } catch {
    return null;
  }
}

function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function buildHeaders(token: string | null): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function getPresignedUrl(
  serverUrl: string,
  authFields: AuthFields,
  token: string | null,
  assetKind: string,
  contentType: string,
  byteSize: number
): Promise<PresignedUrlResult> {
  const res = await fetch(`${serverUrl}/api/captures/upload-url`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify({
      asset_kind: assetKind,
      content_type: contentType,
      byte_size: byteSize,
      install_id: authFields.install_id,
      install_secret: authFields.install_secret,
    }),
  });
  if (!res.ok) {
    throw new Error(`upload-url ${assetKind} failed: ${res.status}`);
  }
  return res.json() as Promise<PresignedUrlResult>;
}

async function uploadToS3(uploadUrl: string, bytes: Uint8Array, contentType: string): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: bytes,
  });
  if (!res.ok) {
    throw new Error(`S3 upload failed: ${res.status}`);
  }
}

export async function syncCaptureToServer(snippet: Snippet): Promise<void> {
  try {
    const [token, authFields] = await Promise.all([
      getAuthToken(),
      getOrCreateInstallCredentials(),
    ]);

    const assets: AssetEntry[] = [];

    // HTML — always present
    assets.push({ kind: "html", bytes: textToBytes(snippet.html), contentType: "text/html" });

    // Thumbnail — only if present and parseable
    if (snippet.thumbnail) {
      const thumb = thumbnailToBytes(snippet.thumbnail);
      if (thumb) {
        assets.push({ kind: "screenshot", bytes: thumb.bytes, contentType: thumb.contentType });
      }
    }

    // Stylesheet — only if non-empty
    if (snippet.styleBlock) {
      assets.push({ kind: "stylesheet", bytes: textToBytes(snippet.styleBlock), contentType: "text/css" });
    }

    // Get all presigned URLs in parallel
    const presignedResults = await Promise.all(
      assets.map((a) =>
        getPresignedUrl(SERVER_URL, authFields, token, a.kind, a.contentType, a.bytes.length)
      )
    );

    // Upload all assets to S3 in parallel
    await Promise.all(
      assets.map((a, i) => uploadToS3(presignedResults[i].url, a.bytes, a.contentType))
    );

    const captureAssets = assets.map((a, i) => ({
      asset_kind: a.kind,
      object_key: presignedResults[i].object_key,
      content_type: a.contentType,
      byte_size: a.bytes.length,
    }));

    const res = await fetch(`${SERVER_URL}/api/captures`, {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify({
        source_url: snippet.sourceUrl,
        captured_at: snippet.createdAt,
        metadata: { snippet_id: snippet.id, title: snippet.title, width: snippet.width, height: snippet.height },
        assets: captureAssets,
        install_id: authFields.install_id,
        install_secret: authFields.install_secret,
      }),
    });

    if (!res.ok) {
      throw new Error(`POST /api/captures failed: ${res.status}`);
    }
  } catch (error) {
    console.error("[sync-capture]", error);
  }
}
