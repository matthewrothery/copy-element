import { Router, type Request, type Response } from 'express';
import { sendSupportInquiryViaSes } from '../../services/email-ses.js';
import { wasSentRecently } from '../../services/email-tracking.js';

export const supportRouter = Router();

const VALID_TOPICS = new Set([
  'Bug report',
  'Billing question',
  'Feature request',
  'Account issue',
  'Other',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;
const MAX_MESSAGE = 2000;

// Per-IP rate limit: 3 submissions per 10 minutes
const IP_WINDOW_MS = 10 * 60 * 1000;
const IP_MAX = 3;
const ipSubmissions = new Map<string, number[]>();

function isIpRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - IP_WINDOW_MS;
  const times = (ipSubmissions.get(ip) ?? []).filter(t => t > cutoff);
  if (times.length >= IP_MAX) return true;
  times.push(now);
  ipSubmissions.set(ip, times);
  return false;
}

// Per-email cooldown: 1 submission per 60 minutes
const EMAIL_COOLDOWN_MS = 60 * 60 * 1000;

// Minimum time (ms) between page load and submission — blocks instant-submit bots
const MIN_LOAD_TO_SUBMIT_MS = 3000;

supportRouter.post('/contact', async (req: Request, res: Response) => {
  // Layer 1: honeypot — bots fill this, humans don't
  const honeypot = req.body.website;
  if (honeypot) {
    res.status(400).json({ error: 'Something went wrong. Please try again.' });
    return;
  }

  // Layer 2: timing check — reject submissions under 3 seconds from page load
  const loadedAt = Number(req.body._loadedAt);
  if (!loadedAt || Date.now() - loadedAt < MIN_LOAD_TO_SUBMIT_MS) {
    res.status(400).json({ error: 'Something went wrong. Please try again.' });
    return;
  }

  // Layer 3: per-IP rate limit
  const ip = req.ip ?? 'unknown';
  if (isIpRateLimited(ip)) {
    res.status(429).json({ error: 'Too many requests. Please wait a few minutes before trying again.' });
    return;
  }

  const { name, email, topic, message } = req.body as {
    name?: unknown;
    email?: unknown;
    topic?: unknown;
    message?: unknown;
  };

  if (typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ error: 'Name is required.' });
    return;
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'A valid email address is required.' });
    return;
  }
  if (typeof topic !== 'string' || !VALID_TOPICS.has(topic)) {
    res.status(400).json({ error: 'A valid topic is required.' });
    return;
  }
  if (typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json({ error: 'Message is required.' });
    return;
  }

  // Layer 4: per-email cooldown
  if (wasSentRecently(email, 'support-inquiry', Date.now() - EMAIL_COOLDOWN_MS)) {
    res.status(429).json({ error: 'A support request from this email was recently submitted. Please wait before submitting again.' });
    return;
  }

  const safeName = name.trim().slice(0, MAX_NAME);
  const safeMessage = message.trim().slice(0, MAX_MESSAGE);

  try {
    await sendSupportInquiryViaSes(safeName, email.trim(), topic, safeMessage);
    res.status(204).end();
  } catch (err) {
    console.error('[support] Failed to send inquiry email:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});
