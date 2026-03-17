import { Router, type Request, type Response } from 'express';
import {
  registerInstall,
  isValidInstallId,
  getInstallByInstallId,
  linkInstallToUser,
  unlinkInstall,
  listInstallsByUserId,
} from '../../services/install.js';
import type { RegisterInstallBody, RegisterInstallResponse } from '../../types/index.js';
import { requireSession, type RequestWithSession } from '../middleware/session.js';

export const installsRouter = Router();

installsRouter.post('/register', (req: Request, res: Response<RegisterInstallResponse | { error: string }>) => {
  const body = req.body as Partial<RegisterInstallBody>;
  const install_id = body?.install_id;
  if (typeof install_id !== 'string' || !install_id.trim()) {
    res.status(400).json({ error: 'install_id is required' });
    return;
  }
  if (!isValidInstallId(install_id)) {
    res.status(400).json({ error: 'install_id must be a UUID or ULID' });
    return;
  }
  const result = registerInstall({
    install_id: install_id.trim(),
    install_secret: typeof body?.install_secret === 'string' ? body.install_secret : undefined,
    extension_version: body?.extension_version,
    chrome_version: body?.chrome_version,
    os_family: body?.os_family,
    screen_width: body?.screen_width,
    screen_height: body?.screen_height,
    locale: body?.locale,
    timezone: body?.timezone,
  });
  res.status(200).json(result);
});

installsRouter.get('/', requireSession, (req: RequestWithSession, res: Response) => {
  const user_id = req.session!.user.id;
  const installs = listInstallsByUserId(user_id);
  res.status(200).json({ installs });
});

installsRouter.post('/link', requireSession, (req: RequestWithSession, res: Response<{ ok: boolean } | { error: string }>) => {
  const install_id = (req.body as { install_id?: string })?.install_id;
  if (typeof install_id !== 'string' || !install_id.trim()) {
    res.status(400).json({ error: 'install_id is required' });
    return;
  }
  const install = getInstallByInstallId(install_id.trim());
  if (!install) {
    res.status(404).json({ error: 'Install not found' });
    return;
  }
  const ok = linkInstallToUser(install_id.trim(), req.session!.user.id);
  res.status(200).json({ ok });
});

installsRouter.post('/unlink', requireSession, (req: RequestWithSession, res: Response<{ ok: boolean } | { error: string }>) => {
  const install_id = (req.body as { install_id?: string })?.install_id;
  if (typeof install_id !== 'string' || !install_id.trim()) {
    res.status(400).json({ error: 'install_id is required' });
    return;
  }
  const ok = unlinkInstall(install_id.trim(), req.session!.user.id);
  res.status(200).json({ ok });
});
