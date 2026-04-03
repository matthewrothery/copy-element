import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveToolsPath(): string {
  if (config.INTERNAL_TOOLS_PATH) {
    return config.INTERNAL_TOOLS_PATH;
  }
  // Default: internal-tools/ is a sibling of server/ in the monorepo
  return path.resolve(__dirname, '../../../../internal-tools');
}

export interface BlogGenerateOptions {
  topic: string;
  author?: string;
  dryRun?: boolean;
}

export interface BlogGenerateResult {
  success: boolean;
  output: string;
  filePath?: string;
}

export async function generateBlogPost(opts: BlogGenerateOptions): Promise<BlogGenerateResult> {
  const toolsPath = resolveToolsPath();
  const entryPoint = path.join(toolsPath, 'generate-blog-post', 'index.ts');

  const args = [entryPoint, opts.topic];
  if (opts.author) args.push('--author', opts.author);
  if (opts.dryRun) args.push('--dry-run');

  return new Promise((resolve) => {
    const child = spawn('npx', ['tsx', ...args], {
      env: { ...process.env, ANTHROPIC_API_KEY: config.ANTHROPIC_API_KEY },
      timeout: 120_000,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    child.on('error', (err) => {
      resolve({ success: false, output: `Spawn error: ${err.message}` });
    });

    child.on('close', (code) => {
      const output = (stdout + stderr).trim();
      if (code === 0) {
        // Try to extract file path from stdout (tool typically prints it)
        const match = output.match(/(?:wrote|created|saved)[^\n]*?([\w./-]+\.mdx?)/i);
        resolve({ success: true, output, filePath: match?.[1] });
      } else {
        resolve({ success: false, output: output || `Process exited with code ${code}` });
      }
    });
  });
}
