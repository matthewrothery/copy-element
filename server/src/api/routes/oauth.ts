import { Router } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../../loaders/auth.js';
import { config } from '../../config/index.js';
import {
  registerClient,
  getClient,
  createAuthCode,
  exchangeAuthCode,
  refreshAccessToken,
  revokeRefreshToken,
} from '../../services/oauth.js';

const router = Router();

router.get('/.well-known/oauth-authorization-server', (_req, res) => {
  const base = config.OAUTH_ISSUER;
  res.json({
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/oauth/token`,
    registration_endpoint: `${base}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['none'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: ['mcp:tools'],
  });
});

router.post('/oauth/register', (req, res) => {
  const { client_name, redirect_uris } = req.body as {
    client_name?: string;
    redirect_uris?: string[];
  };

  if (!Array.isArray(redirect_uris) || redirect_uris.length === 0) {
    res.status(400).json({ error: 'invalid_client_metadata', error_description: 'redirect_uris required' });
    return;
  }

  for (const uri of redirect_uris) {
    if (typeof uri !== 'string' || !uri) {
      res.status(400).json({ error: 'invalid_client_metadata', error_description: 'Invalid redirect_uri' });
      return;
    }
  }

  const clientId = registerClient(client_name ?? '', redirect_uris);
  res.status(201).json({
    client_id: clientId,
    client_name: client_name ?? '',
    redirect_uris,
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
  });
});

router.get('/oauth/authorize', async (req, res) => {
  const {
    response_type,
    client_id,
    redirect_uri,
    code_challenge,
    code_challenge_method,
    state,
    scope,
  } = req.query as {
    response_type?: string;
    client_id?: string;
    redirect_uri?: string;
    code_challenge?: string;
    code_challenge_method?: string;
    state?: string;
    scope?: string;
  };

  if (response_type !== 'code') {
    res.status(400).json({ error: 'unsupported_response_type' });
    return;
  }

  if (!client_id || !redirect_uri || !code_challenge) {
    res.status(400).json({ error: 'invalid_request', error_description: 'client_id, redirect_uri, code_challenge required' });
    return;
  }

  if (code_challenge_method && code_challenge_method !== 'S256') {
    res.status(400).json({ error: 'invalid_request', error_description: 'Only S256 code_challenge_method supported' });
    return;
  }

  const client = getClient(client_id);
  if (!client) {
    res.status(400).json({ error: 'invalid_client' });
    return;
  }

  if (!client.redirect_uris.includes(redirect_uri)) {
    res.status(400).json({ error: 'invalid_request', error_description: 'redirect_uri not registered' });
    return;
  }

  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    const returnTo = `/oauth/authorize?${req.originalUrl.split('?')[1] ?? ''}`;
    const signInBase = (config.FRONTEND_URL || config.BETTER_AUTH_URL).replace(/\/$/, '');
    const signInUrl = new URL(`${signInBase}/sign-in`);
    signInUrl.searchParams.set('return_to', returnTo);
    res.redirect(302, signInUrl.toString());
    return;
  }

  const resolvedScope = scope ?? 'mcp:tools';
  const code = createAuthCode(client_id, session.user.id, resolvedScope, code_challenge, redirect_uri);

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', code);
  if (state) redirectUrl.searchParams.set('state', state);

  res.redirect(302, redirectUrl.toString());
});

router.post('/oauth/token', async (req, res) => {
  const { grant_type, code, client_id, redirect_uri, code_verifier, refresh_token } = req.body as {
    grant_type?: string;
    code?: string;
    client_id?: string;
    redirect_uri?: string;
    code_verifier?: string;
    refresh_token?: string;
  };

  if (!client_id) {
    res.status(400).json({ error: 'invalid_client' });
    return;
  }

  if (grant_type === 'authorization_code') {
    if (!code || !redirect_uri || !code_verifier) {
      res.status(400).json({ error: 'invalid_request', error_description: 'code, redirect_uri, code_verifier required' });
      return;
    }

    const result = await exchangeAuthCode(code, client_id, code_verifier, redirect_uri);
    if (!result) {
      res.status(400).json({ error: 'invalid_grant' });
      return;
    }

    res.json({
      access_token: result.accessToken,
      token_type: 'Bearer',
      expires_in: result.expiresIn,
      refresh_token: result.refreshToken,
      scope: result.scope,
    });
    return;
  }

  if (grant_type === 'refresh_token') {
    if (!refresh_token) {
      res.status(400).json({ error: 'invalid_request', error_description: 'refresh_token required' });
      return;
    }

    const result = await refreshAccessToken(refresh_token, client_id);
    if (!result) {
      res.status(400).json({ error: 'invalid_grant' });
      return;
    }

    res.json({
      access_token: result.accessToken,
      token_type: 'Bearer',
      expires_in: result.expiresIn,
      refresh_token: result.refreshToken,
      scope: result.scope,
    });
    return;
  }

  res.status(400).json({ error: 'unsupported_grant_type' });
});

router.post('/oauth/revoke', (req, res) => {
  const { token } = req.body as { token?: string };
  if (token) {
    revokeRefreshToken(token);
  }
  res.status(200).send('');
});

export { router as oauthRouter };
