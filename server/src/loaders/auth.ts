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
  return origins;
}

export const auth = betterAuth({
  database: getDb() as any,
  baseURL: config.BETTER_AUTH_URL,
  secret: config.BETTER_AUTH_SECRET,
  trustedOrigins: getTrustedOrigins(),
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
        },
      },
    },
  },
});
