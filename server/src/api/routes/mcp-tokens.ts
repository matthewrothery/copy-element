import { Router } from 'express';
import { requireSession, type RequestWithSession } from '../middleware/session.js';
import {
  generateMcpToken,
  getMcpTokenMetaForUser,
  deleteMcpToken,
} from '../../services/mcp-token.js';

const router = Router();

/**
 * POST /api/mcp/token
 * Generate or regenerate an MCP token. Returns plaintext code once.
 */
router.post('/token', requireSession, (req, res) => {
  const userId = (req as RequestWithSession).session!.user.id;
  const { code, mcpUrl } = generateMcpToken(userId);
  res.json({ code, mcp_url: mcpUrl });
});

/**
 * GET /api/mcp/token
 * Returns metadata only — never returns the plaintext code.
 */
router.get('/token', requireSession, (req, res) => {
  const userId = (req as RequestWithSession).session!.user.id;
  const meta = getMcpTokenMetaForUser(userId);
  res.json(meta);
});

/**
 * DELETE /api/mcp/token
 * Revoke token. Returns new token immediately (rotate).
 */
router.delete('/token', requireSession, (req, res) => {
  const userId = (req as RequestWithSession).session!.user.id;
  deleteMcpToken(userId);
  const { code, mcpUrl } = generateMcpToken(userId);
  res.json({ code, mcp_url: mcpUrl });
});

export { router as mcpTokensRouter };
