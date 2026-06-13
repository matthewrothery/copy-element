import { Router, type Request, type Response } from 'express';
import { nanoid } from 'nanoid';
import {
  countCapturesByInstall,
  countCapturesByUser,
  createCaptureWithAssets,
  deleteCaptureById,
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
import {
  hasActivePaidPlan,
  ANONYMOUS_MONTHLY_CAPTURE_LIMIT,
  FREE_MONTHLY_CAPTURE_LIMIT,
} from '../../services/entitlements.js';
import {
  countCapturesByInstallThisMonth,
  countCapturesByUserThisMonth,
} from '../../services/capture.js';
import { recordEvent, wasEventFiredThisMonth, getUserEmail } from '../../services/events.js';
import { enqueueJob } from '../../services/job-queue.js';
import { logger } from '../../logger.js';

export const capturesRouter = Router();

const MAX_ASSETS_PER_CAPTURE = 10;
const GUEST_CAPTURE_LIMIT = 10;
const FREE_USER_CAPTURE_LIMIT = 25;
const MAX_METADATA_JSON_LENGTH = 8192;
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

/** Express 5 types `req.params.*` as `string | string[]`. */
function routeParam(value: string | string[] | undefined): string {
  if (value === undefined) return '';
  return Array.isArray(value) ? (value[0] ?? '') : value;
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
      logger.error('[captures] upload-url error', {
        installId,
        assetKind,
        contentType,
        byteSize,
      }, err);
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
    const snippet_id = typeof body?.metadata?.snippet_id === 'string' ? body.metadata.snippet_id : null;
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

    // Monthly quota pre-check
    if (!req.installUserId) {
      const used = countCapturesByInstallThisMonth(installId);
      if (used >= ANONYMOUS_MONTHLY_CAPTURE_LIMIT) {
        if (!wasEventFiredThisMonth('quota.reached', null, installId)) {
          recordEvent({ type: 'quota.reached', installId, payload: { quota_limit: ANONYMOUS_MONTHLY_CAPTURE_LIMIT } });
        }
        res.status(402).json({
          code: 'quota_reached',
          error: 'Monthly capture limit reached. Create a free account for a higher limit.',
          quota_used: used,
          quota_limit: ANONYMOUS_MONTHLY_CAPTURE_LIMIT,
        });
        return;
      }
    } else if (!hasActivePaidPlan(req.installUserId)) {
      const used = countCapturesByUserThisMonth(req.installUserId);
      if (used >= FREE_MONTHLY_CAPTURE_LIMIT) {
        if (!wasEventFiredThisMonth('quota.reached', req.installUserId)) {
          recordEvent({ type: 'quota.reached', userId: req.installUserId, payload: { quota_limit: FREE_MONTHLY_CAPTURE_LIMIT } });
          const email = getUserEmail(req.installUserId);
          if (email) {
            // Fire limit-reached email (fire-and-forget)
            void import('../../services/email.js').then(({ sendLimitReachedEmail }) =>
              sendLimitReachedEmail(email, FREE_MONTHLY_CAPTURE_LIMIT).catch((err) =>
                console.warn('[captures] limit-reached email failed:', err)
              )
            );
            // Schedule post-limit followup for 48h later
            try {
              enqueueJob('post_limit_followup', { userId: req.installUserId, email, quotaLimit: FREE_MONTHLY_CAPTURE_LIMIT }, Date.now() + 48 * 60 * 60 * 1000);
            } catch (err) {
              console.warn('[captures] post-limit followup job enqueue failed:', err);
            }
          }
        }
        res.status(402).json({
          code: 'quota_reached',
          error: 'Monthly capture limit reached. Upgrade to Pro for unlimited captures.',
          quota_used: used,
          quota_limit: FREE_MONTHLY_CAPTURE_LIMIT,
        });
        return;
      }
    }

    try {
      const capture = createCaptureWithAssets({
        install_id: installId,
        source_url,
        captured_at,
        created_by_install_id: installId,
        metadata_json,
        snippet_id,
        assets,
      });

      // Fire capture.created event + milestone emails for logged-in users
      if (req.installUserId) {
        const totalCount = countCapturesByUser(req.installUserId);
        recordEvent({ type: 'capture.created', userId: req.installUserId, installId, payload: { count: totalCount } });
        const email = getUserEmail(req.installUserId);
        if (email) {
          if (totalCount === 1) {
            void import('../../services/email.js').then(({ sendFirstCaptureEmail }) =>
              sendFirstCaptureEmail(email).catch((err) =>
                console.warn('[captures] first-capture email failed:', err)
              )
            );
          }
          if (totalCount === 3) {
            void import('../../services/email.js').then(({ sendAccountNudgeEmail }) =>
              sendAccountNudgeEmail(email).catch((err) =>
                console.warn('[captures] account-nudge email failed:', err)
              )
            );
          }
          if (totalCount === 10) {
            void import('../../services/email.js').then(({ sendCaptureMilestoneEmail }) =>
              sendCaptureMilestoneEmail(email).catch((err) =>
                console.warn('[captures] capture-milestone email failed:', err)
              )
            );
          }
          // Save-your-work: ≥80% of monthly quota (free users only)
          if (!hasActivePaidPlan(req.installUserId)) {
            const monthlyUsed = countCapturesByUserThisMonth(req.installUserId);
            if (monthlyUsed / FREE_MONTHLY_CAPTURE_LIMIT >= 0.8) {
              void import('../../services/email.js').then(({ sendSaveYourWorkEmail }) =>
                sendSaveYourWorkEmail(email, monthlyUsed, FREE_MONTHLY_CAPTURE_LIMIT).catch((err) =>
                  console.warn('[captures] save-your-work email failed:', err)
                )
              );
            }
          }
        }
      } else {
        const totalCount = countCapturesByInstall(installId);
        recordEvent({ type: 'capture.created', installId, payload: { count: totalCount } });
      }

      // Library size FIFO: evict oldest when over the total library cap
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

/**
 * GET /api/captures/install/:installId/restore — install-auth.
 * Returns captures with presigned S3 GET URLs for all assets.
 * Used by the extension to restore the local library after reinstall or login on a new device.
 */
capturesRouter.get(
  '/install/:installId/restore',
  requireInstallAuth,
  async (req: RequestWithInstall, res: Response) => {
    const installId = req.params.installId;
    if (req.installId !== installId) {
      res.status(403).json({ error: 'Cannot restore another install\'s captures' });
      return;
    }
    const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
    const limit = limitRaw !== undefined && !Number.isNaN(limitRaw) ? Math.min(limitRaw, 50) : 50;
    const cursorRaw = typeof req.query.cursor === 'string' ? parseInt(req.query.cursor, 10) : undefined;
    const cursor = cursorRaw !== undefined && !Number.isNaN(cursorRaw) ? cursorRaw : undefined;

    const list = req.installUserId
      ? listCapturesByUser(req.installUserId, { limit: limit + 1, cursor })
      : listCapturesByInstall(installId, { limit: limit + 1, cursor });
    const hasMore = list.length > limit;
    const page = hasMore ? list.slice(0, limit) : list;

    try {
      const captures = await Promise.all(page.map(async (capture: CaptureWithAssets) => {
        let metadata: Record<string, unknown> = {};
        if (capture.metadata_json) {
          try { metadata = JSON.parse(capture.metadata_json); } catch { /* ignore */ }
        }

        const snippetId = typeof metadata.snippet_id === 'string' ? metadata.snippet_id : null;
        if (!snippetId) return null; // pre-dates metadata schema; skip

        const screenshotAsset = capture.assets.find(a => a.asset_kind === 'screenshot');
        const htmlAsset = capture.assets.find(a => a.asset_kind === 'html');
        const stylesheetAsset = capture.assets.find(a => a.asset_kind === 'stylesheet');

        const [screenshotUrl, htmlUrl, stylesheetUrl] = await Promise.all([
          screenshotAsset ? getSignedGetUrl(screenshotAsset.object_key, 300) : Promise.resolve(null),
          htmlAsset ? getSignedGetUrl(htmlAsset.object_key, 300) : Promise.resolve(null),
          stylesheetAsset ? getSignedGetUrl(stylesheetAsset.object_key, 300) : Promise.resolve(null),
        ]);

        return {
          server_capture_id: capture.id,
          snippet_id: snippetId,
          title: typeof metadata.title === 'string' ? metadata.title : 'Untitled',
          source_url: capture.source_url ?? null,
          captured_at: capture.captured_at,
          width: typeof metadata.width === 'number' ? metadata.width : 0,
          height: typeof metadata.height === 'number' ? metadata.height : 0,
          render_context: metadata.renderContext ?? null,
          root_id: typeof metadata.rootId === 'string' ? metadata.rootId : null,
          external_font_links: Array.isArray(metadata.externalFontLinks) ? metadata.externalFontLinks : null,
          folder_id: typeof metadata.folderId === 'string' ? metadata.folderId : null,
          html_url: htmlUrl,
          screenshot_url: screenshotUrl,
          stylesheet_url: stylesheetUrl,
        };
      }));

      const filtered = captures.filter(Boolean);
      const nextCursor = hasMore && page.length > 0 ? page[page.length - 1].captured_at : null;
      res.status(200).json({ captures: filtered, has_more: hasMore, next_cursor: nextCursor });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate restore payload';
      res.status(500).json({ error: message });
    }
  }
);

/**
 * DELETE /api/captures/install/:installId/:captureId — install-auth.
 * Deletes a specific capture. Caller must own the install and the capture.
 */
capturesRouter.delete(
  '/install/:installId/:captureId',
  requireInstallAuth,
  (req: RequestWithInstall, res: Response) => {
    const installId = routeParam(req.params.installId);
    if (req.installId !== installId) {
      res.status(403).json({ error: 'Cannot delete another install\'s captures' });
      return;
    }
    const captureId = routeParam(req.params.captureId);
    if (!captureId) {
      res.status(400).json({ error: 'Invalid capture ID' });
      return;
    }
    const deleted = deleteCaptureById(captureId, installId);
    if (!deleted) {
      res.status(404).json({ error: 'Capture not found or not owned by this install' });
      return;
    }
    res.status(204).send();
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
        id: capture.id,
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
