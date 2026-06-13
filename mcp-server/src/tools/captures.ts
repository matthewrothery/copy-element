import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpUser, CaptureContent, CaptureSummary } from '../types.js';
import { apiGet } from '../client/api-client.js';
import { cacheGet, cacheSet } from '../cache.js';
import { consumeCallQuota } from '../rate-limiter.js';

interface CaptureAsset {
  asset_kind: string;
  signed_url: string;
}

interface CaptureWithAssets {
  id: string;
  source_url: string | null;
  captured_at: number;
  assets: CaptureAsset[];
}

interface CapturesListResponse {
  captures: Array<{
    id: string;
    source_url: string | null;
    captured_at: number;
    status: string;
    assets: CaptureAsset[];
  }>;
}

interface CaptureDetailResponse {
  capture: CaptureWithAssets;
}

async function fetchCaptureContent(captureId: string, userId: string): Promise<CaptureContent> {
  const data = await apiGet<CaptureDetailResponse>(
    `/internal/mcp/captures/${captureId}?userId=${encodeURIComponent(userId)}`
  );
  const { capture } = data;

  const htmlAsset = capture.assets.find((a) => a.asset_kind === 'html');
  const cssAsset = capture.assets.find((a) => a.asset_kind === 'stylesheet');
  const screenshotAsset = capture.assets.find((a) => a.asset_kind === 'screenshot');

  const [html, css] = await Promise.all([
    htmlAsset ? fetch(htmlAsset.signed_url).then((r) => r.text()) : Promise.resolve(''),
    cssAsset ? fetch(cssAsset.signed_url).then((r) => r.text()) : Promise.resolve(''),
  ]);

  return {
    id: capture.id,
    sourceUrl: capture.source_url,
    capturedAt: capture.captured_at,
    html,
    css,
    screenshotUrl: screenshotAsset?.signed_url ?? null,
  };
}

export function registerCaptureTools(server: McpServer, user: McpUser): void {
  server.registerTool(
    'getLatestCapture',
    {
      description:
        'Get the most recently captured UI element with its HTML and CSS content. Returns full source code ready for conversion.',
      inputSchema: {},
    },
    async () => {
      await consumeCallQuota(user, 1);

      const cacheKey = `latest_capture:${user.userId}`;
      const cached = cacheGet<CaptureContent>(cacheKey);
      if (cached) {
        return { content: [{ type: 'text' as const, text: JSON.stringify(cached, null, 2) }] };
      }

      const listData = await apiGet<CapturesListResponse>(
        `/internal/mcp/captures?userId=${encodeURIComponent(user.userId)}&limit=1`
      );

      if (!listData.captures.length) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'No captures found' }) }],
        };
      }

      const content = await fetchCaptureContent(listData.captures[0].id, user.userId);
      cacheSet(cacheKey, content);

      return { content: [{ type: 'text' as const, text: JSON.stringify(content, null, 2) }] };
    }
  );

  server.registerTool(
    'getCaptureById',
    {
      description: 'Get a specific captured UI element by ID with its HTML and CSS content.',
      inputSchema: {
        id: z.string().describe('Capture ID from listCaptures'),
      },
    },
    async ({ id }) => {
      await consumeCallQuota(user, 1);

      const content = await fetchCaptureContent(id, user.userId);
      return { content: [{ type: 'text' as const, text: JSON.stringify(content, null, 2) }] };
    }
  );

  server.registerTool(
    'listCaptures',
    {
      description:
        'List recent UI captures with metadata (id, sourceUrl, capturedAt). Use getCaptureById or getLatestCapture to fetch HTML/CSS.',
      inputSchema: {
        limit: z.number().int().min(1).max(50).default(20).optional().describe('Max results (default 20)'),
        cursor: z.number().int().optional().describe('captured_at epoch ms for pagination cursor'),
      },
    },
    async ({ limit, cursor }) => {
      await consumeCallQuota(user, 1);

      const params = new URLSearchParams({ userId: user.userId });
      if (limit != null) params.set('limit', String(limit));
      if (cursor != null) params.set('cursor', String(cursor));

      const data = await apiGet<CapturesListResponse>(`/internal/mcp/captures?${params}`);

      const summaries: CaptureSummary[] = data.captures.map((c) => ({
        id: c.id,
        source_url: c.source_url,
        captured_at: c.captured_at,
        status: c.status,
      }));

      return { content: [{ type: 'text' as const, text: JSON.stringify(summaries, null, 2) }] };
    }
  );
}
