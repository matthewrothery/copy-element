import { Router, type Request, type Response } from 'express';
import { nanoid } from 'nanoid';
import {
  countCapturesByInstall,
  countCapturesByUser,
  createCaptureWithAssets,
  deleteOldestCaptureByUser,
  deleteOldestCaptureForInstall,
  listCapturesByInstall,
  listCapturesByUser,
  type AssetKind,
  type CaptureAssetInput,
  type CaptureWithAssets,
} from '../../services/capture.js';
import {
  buildCaptureObjectKey,
  createPresignedPutUrl,
  getSignedGetUrl,
  S3_MAX_PUT_SIZE,
} from '../../services/s3.js';
import { requireInstallAuth, type RequestWithInstall } from '../middleware/install-auth.js';
import { requireSession, type RequestWithSession } from '../middleware/session.js';
import { requireFigmaAuth, type RequestWithFigmaUser } from '../middleware/figma-auth.js';
import { hasActivePaidPlan } from '../../services/entitlements.js';

export const capturesRouter = Router();

const MAX_ASSETS_PER_CAPTURE = 10;
const GUEST_CAPTURE_LIMIT = 10;
const FREE_USER_CAPTURE_LIMIT = 25;
const MAX_METADATA_JSON_LENGTH = 4096;
const ALLOWED_SCREENSHOT_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ALLOWED_HTML_TYPES = ['text/html'];
const ALLOWED_STYLESHEET_TYPES = ['text/css', 'text/plain'];

function getAllowedTypes(kind: AssetKind): string[] {
  switch (kind) {
    case 'screenshot':
      return ALLOWED_SCREENSHOT_TYPES;
    case 'html':
      return ALLOWED_HTML_TYPES;
    case 'stylesheet':
      return ALLOWED_STYLESHEET_TYPES;
    default:
      return [];
  }
}

/** POST /api/captures/upload-url — install-auth. Returns presigned PUT URL and object key. */
capturesRouter.post(
  '/upload-url',
  requireInstallAuth,
  async (req: RequestWithInstall, res: Response<{ url: string; object_key: string; expires_at: string } | { error: string }>) => {
    const installId = req.installId!;
    const body = req.body as { asset_kind?: string; content_type?: string; byte_size?: number; checksum_sha256?: string };
    const assetKind = body?.asset_kind;
    const contentType = body?.content_type;
    const byteSize = body?.byte_size;

    if (typeof assetKind !== 'string' || !['screenshot', 'html', 'stylesheet'].includes(assetKind)) {
      res.status(400).json({ error: 'asset_kind must be screenshot, html, or stylesheet' });
      return;
    }
    if (typeof contentType !== 'string' || !contentType.trim()) {
      res.status(400).json({ error: 'content_type is required' });
      return;
    }
    const allowed = getAllowedTypes(assetKind as AssetKind);
    if (!allowed.includes(contentType)) {
      res.status(400).json({ error: `content_type must be one of: ${allowed.join(', ')}` });
      return;
    }
    if (typeof byteSize !== 'number' || byteSize <= 0 || byteSize > S3_MAX_PUT_SIZE) {
      res.status(400).json({ error: `byte_size must be 1–${S3_MAX_PUT_SIZE}` });
      return;
    }

    try {
      const uniqueId = nanoid(16);
      const objectKey = buildCaptureObjectKey(installId, uniqueId, assetKind as AssetKind);
      const { url, expiresAt } = await createPresignedPutUrl(objectKey, contentType, byteSize);
      res.status(200).json({ url, object_key: objectKey, expires_at: expiresAt });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create upload URL';
      res.status(500).json({ error: message });
    }
  }
);

/** POST /api/captures — install-auth. Submit capture metadata and asset references. */
capturesRouter.post(
  '/',
  requireInstallAuth,
  (req: RequestWithInstall, res: Response) => {
    const installId = req.installId!;
    const body = req.body as {
      source_url?: string;
      captured_at?: number;
      metadata?: Record<string, unknown>;
      assets?: Array<{
        asset_kind?: string;
        object_key?: string;
        content_type?: string;
        byte_size?: number;
        checksum_sha256?: string;
      }>;
    };

    const source_url = typeof body?.source_url === 'string' ? body.source_url : '';
    const captured_at = typeof body?.captured_at === 'number' ? body.captured_at : Date.now();
    const metadata_json =
      body?.metadata != null
        ? (JSON.stringify(body.metadata).length <= MAX_METADATA_JSON_LENGTH
          ? JSON.stringify(body.metadata)
          : null)
        : null;
    if (metadata_json === null && body?.metadata != null) {
      res.status(400).json({ error: `metadata too large (max ${MAX_METADATA_JSON_LENGTH} chars)` });
      return;
    }

    const assetsRaw = Array.isArray(body?.assets) ? body.assets : [];
    if (assetsRaw.length === 0 || assetsRaw.length > MAX_ASSETS_PER_CAPTURE) {
      res.status(400).json({ error: `assets count must be 1–${MAX_ASSETS_PER_CAPTURE}` });
      return;
    }

    const prefix = `captures/${installId}/`;
    const assets: CaptureAssetInput[] = [];
    for (const a of assetsRaw) {
      const kind = a?.asset_kind;
      const object_key = a?.object_key;
      if (typeof kind !== 'string' || !['screenshot', 'html', 'stylesheet'].includes(kind) || typeof object_key !== 'string' || !object_key.startsWith(prefix)) {
        res.status(400).json({ error: 'Each asset must have asset_kind and object_key under your install' });
        return;
      }
      assets.push({
        asset_kind: kind as AssetKind,
        object_key,
        content_type: typeof a?.content_type === 'string' ? a.content_type : null,
        byte_size: typeof a?.byte_size === 'number' ? a.byte_size : null,
        checksum_sha256: typeof a?.checksum_sha256 === 'string' ? a.checksum_sha256 : null,
      });
    }

    try {
      const capture = createCaptureWithAssets({
        install_id: installId,
        source_url,
        captured_at,
        created_by_install_id: installId,
        metadata_json,
        assets,
      });

      if (!req.installUserId) {
        let count = countCapturesByInstall(installId);
        while (count > GUEST_CAPTURE_LIMIT) {
          deleteOldestCaptureForInstall(installId);
          count--;
        }
      } else if (!hasActivePaidPlan(req.installUserId)) {
        let count = countCapturesByUser(req.installUserId);
        while (count > FREE_USER_CAPTURE_LIMIT) {
          deleteOldestCaptureByUser(req.installUserId);
          count--;
        }
      }

      res.status(201).json(capture);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create capture';
      res.status(500).json({ error: message });
    }
  }
);

/** GET /api/captures/install/:installId — install-auth; caller must own the install. */
capturesRouter.get(
  '/install/:installId',
  requireInstallAuth,
  (req: RequestWithInstall, res: Response) => {
    const installId = req.params.installId;
    if (req.installId !== installId) {
      res.status(403).json({ error: 'Cannot list another install\'s captures' });
      return;
    }
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
    const cursorRaw = typeof req.query.cursor === 'string' ? parseInt(req.query.cursor, 10) : undefined;
    const cursor = cursorRaw !== undefined && !Number.isNaN(cursorRaw) ? cursorRaw : undefined;
    const list = listCapturesByInstall(installId, { limit: Number.isNaN(limit) ? undefined : limit, cursor });
    res.status(200).json({ captures: list });
  }
);

/** GET /api/captures/figma — Figma Bearer token auth. Returns captures with presigned asset URLs. */
capturesRouter.get(
  '/figma',
  requireFigmaAuth,
  async (req: RequestWithFigmaUser, res: Response) => {
    const userId = req.figmaUserId!;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
    const cursorRaw = typeof req.query.cursor === 'string' ? parseInt(req.query.cursor, 10) : undefined;
    const cursor = cursorRaw !== undefined && !Number.isNaN(cursorRaw) ? cursorRaw : undefined;
    const list = listCapturesByUser(userId, { limit: Number.isNaN(limit) ? undefined : limit, cursor });

    const captures = await Promise.all(list.map(async (capture: CaptureWithAssets) => {
      let metadata: Record<string, unknown> = {};
      if (capture.metadata_json) {
        try { metadata = JSON.parse(capture.metadata_json); } catch { /* ignore */ }
      }

      const screenshotAsset = capture.assets.find(a => a.asset_kind === 'screenshot');
      const htmlAsset = capture.assets.find(a => a.asset_kind === 'html');
      const stylesheetAsset = capture.assets.find(a => a.asset_kind === 'stylesheet');

      const [screenshotUrl, htmlUrl, stylesheetUrl] = await Promise.all([
        screenshotAsset ? getSignedGetUrl(screenshotAsset.object_key, 300) : Promise.resolve(null),
        htmlAsset ? getSignedGetUrl(htmlAsset.object_key, 300) : Promise.resolve(null),
        stylesheetAsset ? getSignedGetUrl(stylesheetAsset.object_key, 300) : Promise.resolve(null),
      ]);

      return {
        id: String(capture.id),
        title: typeof metadata.title === 'string' ? metadata.title : 'Untitled',
        width: typeof metadata.width === 'number' ? metadata.width : 400,
        height: typeof metadata.height === 'number' ? metadata.height : 200,
        source_url: capture.source_url ?? null,
        captured_at: capture.captured_at,
        screenshot_url: screenshotUrl,
        html_url: htmlUrl,
        stylesheet_url: stylesheetUrl,
      };
    }));

    res.status(200).json({ captures });
  }
);

/** GET /api/captures — session required. List captures for current user across linked installs. */
capturesRouter.get(
  '/',
  requireSession,
  (req: RequestWithSession, res: Response) => {
    const userId = req.session!.user.id;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
    const cursorRaw = typeof req.query.cursor === 'string' ? parseInt(req.query.cursor, 10) : undefined;
    const cursor = cursorRaw !== undefined && !Number.isNaN(cursorRaw) ? cursorRaw : undefined;
    const list = listCapturesByUser(userId, { limit: Number.isNaN(limit) ? undefined : limit, cursor });
    res.status(200).json({ captures: list });
  }
);
