import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpUser } from '../types.js';
import { apiGet } from '../client/api-client.js';
import { consumeCallQuota } from '../rate-limiter.js';

interface CaptureAsset {
  asset_kind: string;
  signed_url: string;
}

interface CapturesListResponse {
  captures: Array<{ id: string; source_url: string | null }>;
}

interface CaptureDetailResponse {
  capture: {
    id: string;
    source_url: string | null;
    captured_at: number;
    assets: CaptureAsset[];
  };
}

async function resolveCapture(
  captureId: string | undefined,
  userId: string
): Promise<{ html: string; css: string; sourceUrl: string | null; captureId: string } | null> {
  let id = captureId;

  if (id == null) {
    const listData = await apiGet<CapturesListResponse>(
      `/internal/mcp/captures?userId=${encodeURIComponent(userId)}&limit=1`
    );
    if (!listData.captures.length) return null;
    id = listData.captures[0].id;
  }

  const data = await apiGet<CaptureDetailResponse>(
    `/internal/mcp/captures/${id}?userId=${encodeURIComponent(userId)}`
  );
  const { capture } = data;

  const htmlAsset = capture.assets.find((a) => a.asset_kind === 'html');
  const cssAsset = capture.assets.find((a) => a.asset_kind === 'stylesheet');

  const [html, css] = await Promise.all([
    htmlAsset ? fetch(htmlAsset.signed_url).then((r) => r.text()) : Promise.resolve(''),
    cssAsset ? fetch(cssAsset.signed_url).then((r) => r.text()) : Promise.resolve(''),
  ]);

  return { html, css, sourceUrl: capture.source_url, captureId: id };
}

export function registerPromptTools(server: McpServer, user: McpUser): void {
  server.registerTool(
    'getBasicPrompt',
    {
      description:
        'Get a formatted prompt for AI tools containing the captured HTML and CSS. Paste directly into your AI chat.',
      inputSchema: {
        captureId: z.string().optional().describe('Capture ID; uses latest if omitted'),
      },
    },
    async ({ captureId }) => {
      await consumeCallQuota(user, 1);

      const result = await resolveCapture(captureId, user.userId);
      if (!result) {
        return { content: [{ type: 'text' as const, text: 'No captures found.' }] };
      }

      const prompt = `# Captured UI Element
Source: ${result.sourceUrl ?? 'unknown'}

## HTML
\`\`\`html
${result.html}
\`\`\`

## CSS
\`\`\`css
${result.css}
\`\`\`

Rebuild this UI component using the HTML and CSS above. Preserve visual appearance and structure.`;

      return { content: [{ type: 'text' as const, text: prompt }] };
    }
  );

  server.registerTool(
    'getAdvancedPrompt',
    {
      description:
        'Get an enhanced prompt with element structure and resource mapping. Pro plan only.',
      inputSchema: {
        captureId: z.string().optional().describe('Capture ID; uses latest if omitted'),
        includeStructure: z.boolean().optional().describe('Include element structure analysis'),
      },
    },
    async ({ captureId, includeStructure }) => {
      if (user.planCode === 'free') {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'PLAN_REQUIRED',
                message: 'getAdvancedPrompt requires a Pro plan. Upgrade at https://elementarmory.com/billing',
              }),
            },
          ],
        };
      }

      await consumeCallQuota(user, 1);

      const result = await resolveCapture(captureId, user.userId);
      if (!result) {
        return { content: [{ type: 'text' as const, text: 'No captures found.' }] };
      }

      let structureSection = '';
      if (includeStructure) {
        const structure = buildElementOutline(result.html);
        structureSection = `\n## Element Structure\n${structure}\n`;
      }

      const resources = extractResources(result.html, result.css);
      const resourceSection =
        resources.length > 0
          ? `\n## External Resources\n${resources.map((r) => `- ${r}`).join('\n')}\n`
          : '';

      const prompt = `# Captured UI Element (Advanced)
Source: ${result.sourceUrl ?? 'unknown'}
${structureSection}${resourceSection}
## HTML
\`\`\`html
${result.html}
\`\`\`

## CSS
\`\`\`css
${result.css}
\`\`\`

You need to implement this element into the existing code base. Focus on creating a perfect replica with style changes to match the existing codebase and rules. The code may include external resources — replace them with existing resources, or use placeholders.`;

      return { content: [{ type: 'text' as const, text: prompt }] };
    }
  );
}

function buildElementOutline(html: string): string {
  const tagPattern = /<(\/?)([\w-]+)[^>]*>/g;
  const lines: string[] = [];
  let depth = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(html)) !== null) {
    const isClose = match[1] === '/';
    const tag = match[2].toLowerCase();
    const voidTags = new Set(['br', 'hr', 'img', 'input', 'link', 'meta', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr']);
    if (isClose) {
      depth = Math.max(0, depth - 1);
    } else {
      lines.push(`${'  '.repeat(depth)}<${tag}>`);
      if (!voidTags.has(tag)) depth++;
    }
  }

  return lines.slice(0, 50).join('\n');
}

function extractResources(html: string, css: string): string[] {
  const resources = new Set<string>();
  const imgSrc = html.matchAll(/src="(https?:\/\/[^"]+)"/g);
  for (const m of imgSrc) resources.add(`Image: ${m[1]}`);
  const cssUrl = css.matchAll(/url\(['"]?(https?:\/\/[^'")\s]+)['"]?\)/g);
  for (const m of cssUrl) resources.add(`CSS resource: ${m[1]}`);
  return Array.from(resources).slice(0, 20);
}
