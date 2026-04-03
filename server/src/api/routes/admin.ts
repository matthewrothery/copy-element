import { Router, type Request, type Response } from 'express';
import { requireSession, type RequestWithSession } from '../middleware/session.js';
import { requireAdmin } from '../middleware/admin-auth.js';
import {
  getOverview,
  getFunnelMetrics,
  getWebsiteAnalytics,
  getUserList,
  getRevenueMetrics,
  getErrorMetrics,
  getRetentionMetrics,
  getModalMetrics,
  getPageDurations,
  getPreInstallJourney,
  getLimitReachedBreakdown,
} from '../../services/admin-queries.js';
import { grantComplimentary, revokeComplimentary, getComplimentaryGrant } from '../../services/complimentary.js';
import { getUserEntitlement } from '../../services/entitlements.js';
import { generateBlogPost } from '../../services/blog-generator.js';
import type { PlanCode } from '../../services/billing-plan-map.js';
import { config } from '../../config/index.js';

export const adminRouter = Router();

// All admin routes require session + admin-user check
adminRouter.use(requireSession, requireAdmin);

/** CORS headers for admin SPA */
adminRouter.use((_req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Origin', config.ADMIN_ORIGIN);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

/** GET /api/admin/me-admin — confirms admin status */
adminRouter.get('/me-admin', (_req: Request, res: Response) => {
  res.json({ isAdmin: true });
});

/** GET /api/admin/overview?days=30 */
adminRouter.get('/overview', (_req: Request, res: Response) => {
  const days = Math.min(90, Math.max(1, parseInt((_req.query.days as string) ?? '30', 10) || 30));
  res.json(getOverview(days));
});

/** GET /api/admin/funnel?days=90 */
adminRouter.get('/funnel', (_req: Request, res: Response) => {
  const days = Math.min(365, Math.max(1, parseInt((_req.query.days as string) ?? '90', 10) || 90));
  res.json({ steps: getFunnelMetrics(days) });
});

/** GET /api/admin/analytics?days=30 */
adminRouter.get('/analytics', (_req: Request, res: Response) => {
  const days = Math.min(90, Math.max(1, parseInt((_req.query.days as string) ?? '30', 10) || 30));
  res.json(getWebsiteAnalytics(days));
});

/** GET /api/admin/users?page=1&limit=50&search= */
adminRouter.get('/users', (_req: Request, res: Response) => {
  const page = Math.max(1, parseInt((_req.query.page as string) ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt((_req.query.limit as string) ?? '50', 10) || 50));
  const search = ((_req.query.search as string) ?? '').trim();
  res.json(getUserList(page, limit, search));
});

/** GET /api/admin/revenue?months=12 */
adminRouter.get('/revenue', (_req: Request, res: Response) => {
  const months = Math.min(24, Math.max(1, parseInt((_req.query.months as string) ?? '12', 10) || 12));
  res.json(getRevenueMetrics(months));
});

/** GET /api/admin/errors?days=7 */
adminRouter.get('/errors', (_req: Request, res: Response) => {
  const days = Math.min(90, Math.max(1, parseInt((_req.query.days as string) ?? '7', 10) || 7));
  res.json(getErrorMetrics(days));
});

/** GET /api/admin/retention */
adminRouter.get('/retention', (_req: Request, res: Response) => {
  res.json(getRetentionMetrics());
});

/** GET /api/admin/modals?days=30 */
adminRouter.get('/modals', (_req: Request, res: Response) => {
  const days = Math.min(90, Math.max(1, parseInt((_req.query.days as string) ?? '30', 10) || 30));
  res.json(getModalMetrics(days));
});

/** GET /api/admin/page-durations?days=30 */
adminRouter.get('/page-durations', (_req: Request, res: Response) => {
  const days = Math.min(90, Math.max(1, parseInt((_req.query.days as string) ?? '30', 10) || 30));
  res.json({ pages: getPageDurations(days) });
});

/** GET /api/admin/pre-install-journey?days=30 */
adminRouter.get('/pre-install-journey', (_req: Request, res: Response) => {
  const days = Math.min(90, Math.max(1, parseInt((_req.query.days as string) ?? '30', 10) || 30));
  res.json({ pages: getPreInstallJourney(days) });
});

/** GET /api/admin/limit-reached?days=30 */
adminRouter.get('/limit-reached', (_req: Request, res: Response) => {
  const days = Math.min(90, Math.max(1, parseInt((_req.query.days as string) ?? '30', 10) || 30));
  res.json({ breakdown: getLimitReachedBreakdown(days) });
});

/** POST /api/admin/users/:id/complimentary */
adminRouter.post('/users/:id/complimentary', (req: RequestWithSession, res: Response) => {
  const userId = req.params['id'] as string;
  const planCode = ((req.body as Record<string, unknown>)?.plan_code ?? 'pro') as PlanCode;

  if (planCode !== 'pro' && planCode !== 'team') {
    res.status(400).json({ error: 'plan_code must be "pro" or "team"' });
    return;
  }

  grantComplimentary(userId, planCode);
  const grant = getComplimentaryGrant(userId);
  const entitlement = getUserEntitlement(userId);
  res.json({ grant, entitlement });
});

/** DELETE /api/admin/users/:id/complimentary */
adminRouter.delete('/users/:id/complimentary', (req: RequestWithSession, res: Response) => {
  const userId = req.params['id'] as string;
  revokeComplimentary(userId);
  const grant = getComplimentaryGrant(userId);
  const entitlement = getUserEntitlement(userId);
  res.json({ grant: grant ?? null, entitlement });
});

/** POST /api/admin/blog/generate */
adminRouter.post('/blog/generate', async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const topic = typeof body.topic === 'string' ? body.topic.trim() : '';

  if (!topic) {
    res.status(400).json({ error: 'topic is required' });
    return;
  }

  const author = typeof body.author === 'string' ? body.author.trim() : undefined;
  const dryRun = body.dry_run === true;

  const result = await generateBlogPost({ topic, author, dryRun });
  res.json(result);
});
