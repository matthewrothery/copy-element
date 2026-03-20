import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpUser, TargetFramework, TargetStyling } from '../types.js';
import { apiGet, apiPost } from '../client/api-client.js';
import { consumeCallQuota } from '../rate-limiter.js';
import { config } from '../config.js';

const AI_MODEL = 'claude-sonnet-4-6';
const COST_INPUT_MICROS_PER_TOKEN = 3;
const COST_OUTPUT_MICROS_PER_TOKEN = 15;
const AI_TIMEOUT_MS = 120_000;

interface CaptureAsset {
  asset_kind: string;
  signed_url: string;
}

interface CapturesListResponse {
  captures: Array<{ id: number }>;
}

interface CaptureDetailResponse {
  capture: {
    id: number;
    assets: CaptureAsset[];
  };
}

interface StartResponse {
  id: string;
}

async function resolveHtmlCss(
  captureId: number | undefined,
  html: string | undefined,
  css: string | undefined,
  userId: string
): Promise<{ html: string; css: string; resolvedCaptureId: number | null }> {
  if (html != null && css != null) {
    return { html, css, resolvedCaptureId: captureId ?? null };
  }

  let id = captureId;
  if (id == null) {
    const listData = await apiGet<CapturesListResponse>(
      `/internal/mcp/captures?userId=${encodeURIComponent(userId)}&limit=1`
    );
    if (!listData.captures.length) return { html: html ?? '', css: css ?? '', resolvedCaptureId: null };
    id = listData.captures[0].id;
  }

  const data = await apiGet<CaptureDetailResponse>(
    `/internal/mcp/captures/${id}?userId=${encodeURIComponent(userId)}`
  );
  const htmlAsset = data.capture.assets.find((a) => a.asset_kind === 'html');
  const cssAsset = data.capture.assets.find((a) => a.asset_kind === 'stylesheet');

  const [resolvedHtml, resolvedCss] = await Promise.all([
    htmlAsset ? fetch(htmlAsset.signed_url).then((r) => r.text()) : Promise.resolve(html ?? ''),
    cssAsset ? fetch(cssAsset.signed_url).then((r) => r.text()) : Promise.resolve(css ?? ''),
  ]);

  return { html: resolvedHtml, css: resolvedCss, resolvedCaptureId: id };
}

function buildSystemPrompt(targetFramework: TargetFramework, targetStyling: TargetStyling): string {
  const tailwindRule =
    targetStyling === 'tailwind'
      ? 'Replace all CSS with Tailwind utility classes. Do not generate separate CSS.'
      : '';

  return `You are a UI component conversion expert. Convert the following HTML and CSS into a ${targetFramework} component using ${targetStyling} for styling.

Rules:
- Output only the component code, no explanations or markdown code fences
- Use ${targetFramework} conventions and best practices
${tailwindRule ? `- ${tailwindRule}` : ''}
- Preserve visual appearance and interactive structure
- Use semantic HTML equivalents in the target framework
- Handle any images, icons, or fonts appropriately`;
}

export function registerAiConvertTools(server: McpServer, user: McpUser): void {
  const anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

  server.registerTool(
    'convertCapture',
    {
      description:
        'Convert a captured UI element into a component for your target framework using AI. Costs 5 quota units. Returns production-ready component code.',
      inputSchema: {
        captureId: z.number().int().optional().describe('Capture ID; uses latest if omitted'),
        html: z.string().optional().describe('Raw HTML to convert (skips fetch if provided with css)'),
        css: z.string().optional().describe('Raw CSS to convert (skips fetch if provided with html)'),
        targetFramework: z
          .enum(['react', 'vue', 'svelte', 'solid', 'alpine', 'astro', 'lit', 'preact', 'solidjs'])
          .describe('Target framework for the component'),
        targetStyling: z
          .enum(['tailwind', 'css-modules', 'styled-components', 'inline'])
          .describe('Styling approach for the component'),
      },
    },
    async ({ captureId, html, css, targetFramework, targetStyling }) => {
      // Consume 5 units BEFORE AI call to prevent quota bypass on errors
      await consumeCallQuota(user, 5);

      const { html: sourceHtml, css: sourceCss, resolvedCaptureId } = await resolveHtmlCss(
        captureId,
        html,
        css,
        user.userId
      );

      if (!sourceHtml && !sourceCss) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ error: 'No HTML or CSS source found. Capture something first.' }),
            },
          ],
        };
      }

      // Log pending row
      const { id: requestId } = await apiPost<StartResponse>(
        '/internal/mcp/ai-conversion/start',
        {
          userId: user.userId,
          captureId: resolvedCaptureId,
          targetFramework,
          targetStyling,
          aiModel: AI_MODEL,
        },
        AI_TIMEOUT_MS
      );

      const systemPrompt = buildSystemPrompt(targetFramework as TargetFramework, targetStyling as TargetStyling);
      const userMessage = `HTML:\n${sourceHtml}\n\nCSS:\n${sourceCss}`;

      try {
        const response = await anthropic.messages.create(
          {
            model: AI_MODEL,
            max_tokens: 8192,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
          },
          { timeout: AI_TIMEOUT_MS }
        );

        const textContent = response.content.find((c) => c.type === 'text');
        const code = textContent?.type === 'text' ? textContent.text : '';

        const inputTokens = response.usage.input_tokens;
        const outputTokens = response.usage.output_tokens;
        const costMicros =
          inputTokens * COST_INPUT_MICROS_PER_TOKEN + outputTokens * COST_OUTPUT_MICROS_PER_TOKEN;

        await apiPost('/internal/mcp/ai-conversion/complete', {
          id: requestId,
          inputTokens,
          outputTokens,
          costMicros,
          responseText: code,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ code, framework: targetFramework, styling: targetStyling, requestId, inputTokens, outputTokens }, null, 2),
            },
          ],
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        await apiPost('/internal/mcp/ai-conversion/fail', { id: requestId, errorMessage });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ error: `AI conversion failed: ${errorMessage}`, requestId }),
            },
          ],
        };
      }
    }
  );
}
