import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins';
import { getDb } from '../db/connection.js';
import { config } from '../config/index.js';


async function sendMagicLinkPlaceholder(args: { email: string; url: string; token?: string }): Promise<void> {
  // Wired to SES + react-email in services/email.ts when FROM_EMAIL is set
  try {
    const { sendMagicLinkEmail } = await import('../services/email.js');
    await sendMagicLinkEmail(args.email, args.url);
  } catch {
    console.warn('[auth] Magic link (email not sent):', args.url);
  }
}

function getTrustedOrigins(): string[] {
  const origins: string[] = [];
  try {
    origins.push(new URL(config.BETTER_AUTH_URL).origin);
  } catch {
    // ignore invalid BETTER_AUTH_URL
  }
  if (config.FRONTEND_URL) {
    try {
      const frontOrigin = new URL(config.FRONTEND_URL).origin;
      if (!origins.includes(frontOrigin)) {
        origins.push(frontOrigin);
      }
    } catch {
      // ignore invalid FRONTEND_URL
    }
  }
  if (config.ADMIN_ORIGIN) {
    try {
      const adminOrigin = new URL(config.ADMIN_ORIGIN).origin;
      if (!origins.includes(adminOrigin)) {
        origins.push(adminOrigin);
      }
    } catch {
      // ignore invalid ADMIN_ORIGIN
    }
  }
  return origins;
}

export const auth = betterAuth({
  database: getDb() as any,
  baseURL: config.BETTER_AUTH_URL,
  secret: config.BETTER_AUTH_SECRET,
  trustedOrigins: getTrustedOrigins(),
  advanced: {
    crossSubdomainCookies: {
      enabled: config.NODE_ENV === 'production',
      domain: '.elementarmory.com',
    },
  },
  socialProviders: {
    google: {
      clientId: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: sendMagicLinkPlaceholder,
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const { sendWelcomeEmail } = await import('../services/email.js');
            await sendWelcomeEmail(user.email, user.name ?? undefined);
          } catch (err) {
            console.warn('[auth] Welcome email failed:', err);
          }
          try {
            const { recordEvent } = await import('../services/events.js');
            recordEvent({ type: 'user.created', userId: user.id });
          } catch (err) {
            console.warn('[auth] user.created event failed:', err);
          }
          try {
            const { enqueueJob } = await import('../services/job-queue.js');
            const name = user.name ?? undefined;
            const now = Date.now();
            enqueueJob('onboarding_24h', { userId: user.id, email: user.email, name }, now + 24 * 60 * 60 * 1000);
            enqueueJob('onboarding_day3', { userId: user.id, email: user.email, name }, now + 3 * 24 * 60 * 60 * 1000);
          } catch (err) {
            console.warn('[auth] Onboarding job enqueue failed:', err);
          }
        },
      },
    },
  },
});
