import { Router } from 'express';
import { requireInternalAuth } from '../middleware/internal-auth.js';
import { grantComplimentary, revokeComplimentary, getComplimentaryGrant } from '../../services/complimentary.js';
import { getUserEntitlement } from '../../services/entitlements.js';
import type { PlanCode } from '../../services/billing-plan-map.js';

const router = Router();
router.use(requireInternalAuth);

/**
 * GET /internal/admin/users/:userId/complimentary
 * Returns the most recent complimentary grant record and current entitlement.
 */
router.get('/users/:userId/complimentary', (req, res) => {
  const { userId } = req.params;
  const grant = getComplimentaryGrant(userId);
  const entitlement = getUserEntitlement(userId);
  res.json({ grant: grant ?? null, entitlement });
});

/**
 * POST /internal/admin/users/:userId/complimentary
 * Body: { plan_code?: 'pro' | 'team' }
 * Grants complimentary paid access to a user.
 */
router.post('/users/:userId/complimentary', (req, res) => {
  const { userId } = req.params;
  const planCode = (req.body?.plan_code ?? 'pro') as PlanCode;

  if (planCode !== 'pro' && planCode !== 'team') {
    res.status(400).json({ error: 'plan_code must be "pro" or "team"' });
    return;
  }

  grantComplimentary(userId, planCode);
  const grant = getComplimentaryGrant(userId);
  const entitlement = getUserEntitlement(userId);
  res.json({ grant, entitlement });
});

/**
 * DELETE /internal/admin/users/:userId/complimentary
 * Revokes all active complimentary grants for a user.
 */
router.delete('/users/:userId/complimentary', (req, res) => {
  const { userId } = req.params;
  revokeComplimentary(userId);
  const grant = getComplimentaryGrant(userId);
  const entitlement = getUserEntitlement(userId);
  res.json({ grant: grant ?? null, entitlement });
});

export { router as internalAdminRouter };
