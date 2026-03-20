import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpUser } from '../types.js';
import { apiGet } from '../client/api-client.js';
import { consumeCallQuota } from '../rate-limiter.js';

interface CaptureAsset {
  asset_kind: string;
  signed_url: string;
}

interface CaptureDetailResponse {
  capture: {
    id: number;
    assets: CaptureAsset[];
  };
}

interface CapturesListResponse {
  captures: Array<{ id: number }>;
}

async function resolveHtmlCss(
  captureId: number | undefined,
  html: string | undefined,
  css: string | undefined,
  userId: string
): Promise<{ html: string; css: string }> {
  if (html != null || css != null) {
    return { html: html ?? '', css: css ?? '' };
  }

  let id = captureId;
  if (id == null) {
    const listData = await apiGet<CapturesListResponse>(
      `/internal/mcp/captures?userId=${encodeURIComponent(userId)}&limit=1`
    );
    if (!listData.captures.length) return { html: '', css: '' };
    id = listData.captures[0].id;
  }

  const data = await apiGet<CaptureDetailResponse>(
    `/internal/mcp/captures/${id}?userId=${encodeURIComponent(userId)}`
  );
  const htmlAsset = data.capture.assets.find((a) => a.asset_kind === 'html');
  const cssAsset = data.capture.assets.find((a) => a.asset_kind === 'stylesheet');
  const [resolvedHtml, resolvedCss] = await Promise.all([
    htmlAsset ? fetch(htmlAsset.signed_url).then((r) => r.text()) : Promise.resolve(''),
    cssAsset ? fetch(cssAsset.signed_url).then((r) => r.text()) : Promise.resolve(''),
  ]);
  return { html: resolvedHtml, css: resolvedCss };
}

function cleanHtml(html: string): string {
  return html
    // Remove script tags and contents
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove on* event attributes
    .replace(/\s+on\w+="[^"]*"/gi, '')
    .replace(/\s+on\w+='[^']*'/gi, '')
    // Remove tracking data attributes
    .replace(/\s+data-(track|analytics|gtm|fb|ga|pixel)[a-z-]*="[^"]*"/gi, '')
    // Normalize whitespace
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function cleanCss(css: string): string {
  return css
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function registerTransformTools(server: McpServer, user: McpUser): void {
  server.registerTool(
    'cleanCapture',
    {
      description:
        'Strip scripts, event handlers, and tracking attributes from HTML. Normalizes whitespace. Safe to paste into prompts.',
      inputSchema: {
        captureId: z.number().int().optional().describe('Capture ID; uses latest if omitted'),
        html: z.string().optional().describe('Raw HTML to clean (skips fetch if provided)'),
        css: z.string().optional().describe('Raw CSS to clean (skips fetch if provided)'),
      },
    },
    async ({ captureId, html, css }) => {
      await consumeCallQuota(user, 1);

      const source = await resolveHtmlCss(captureId, html, css, user.userId);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              { cleanedHtml: cleanHtml(source.html), cleanedCss: cleanCss(source.css) },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    'extractComponentStructure',
    {
      description:
        'Parse HTML into a hierarchical element structure. Useful for understanding component layout before conversion.',
      inputSchema: {
        html: z.string().describe('HTML to parse'),
      },
    },
    async ({ html }) => {
      await consumeCallQuota(user, 1);

      const elements: Array<{ tag: string; depth: number; classes: string[] }> = [];
      const tagPattern = /<(\/?)([\w-]+)([^>]*)>/g;
      const voidTags = new Set([
        'br', 'hr', 'img', 'input', 'link', 'meta', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr',
      ]);

      let depth = 0;
      let match: RegExpExecArray | null;

      while ((match = tagPattern.exec(html)) !== null) {
        const isClose = match[1] === '/';
        const tag = match[2].toLowerCase();
        const attrs = match[3];

        if (isClose) {
          depth = Math.max(0, depth - 1);
        } else {
          const classMatch = attrs.match(/class="([^"]*)"/);
          const classes = classMatch ? classMatch[1].split(/\s+/).filter(Boolean) : [];
          elements.push({ tag, depth, classes });
          if (!voidTags.has(tag)) depth++;
        }
      }

      const lines = elements
        .slice(0, 100)
        .map((e) => `${'  '.repeat(e.depth)}<${e.tag}${e.classes.length ? ` .${e.classes.join('.')}` : ''}>`);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ structure: lines.join('\n'), elements: elements.slice(0, 100) }, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    'mapExternalResources',
    {
      description:
        'Scan HTML and CSS for external resources: images, fonts, CDN links. Helps when converting to handle asset references.',
      inputSchema: {
        html: z.string().describe('HTML to scan'),
        css: z.string().describe('CSS to scan'),
      },
    },
    async ({ html, css }) => {
      await consumeCallQuota(user, 1);

      const images = new Set<string>();
      const fonts = new Set<string>();
      const cdnLinks = new Set<string>();
      const warnings: string[] = [];

      // img src
      for (const m of html.matchAll(/src="(https?:\/\/[^"]+)"/g)) images.add(m[1]);
      // CSS url()
      for (const m of css.matchAll(/url\(['"]?(https?:\/\/[^'")\s]+)['"]?\)/g)) {
        const url = m[1];
        if (/font/i.test(url)) fonts.add(url);
        else images.add(url);
      }
      // @font-face
      for (const m of css.matchAll(/@font-face\s*\{[^}]+src:\s*url\(['"]?([^'")\s]+)['"]?\)/g)) {
        fonts.add(m[1]);
      }
      // external link hrefs
      for (const m of html.matchAll(/<link[^>]+href="(https?:\/\/[^"]+)"/g)) {
        const url = m[1];
        if (/font/i.test(url)) fonts.add(url);
        else cdnLinks.add(url);
      }
      // external script srcs
      for (const m of html.matchAll(/<script[^>]+src="(https?:\/\/[^"]+)"/g)) {
        cdnLinks.add(m[1]);
        warnings.push(`External script detected: ${m[1]} — will not work in converted component`);
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                images: Array.from(images),
                fonts: Array.from(fonts),
                cdnLinks: Array.from(cdnLinks),
                warnings,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
