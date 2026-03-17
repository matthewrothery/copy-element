import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';
import * as styles from './styles.js';

export interface FeatureItem {
  title: string;
  description: string;
}

export interface FeatureUpdateEmailProps {
  name?: string;
  email: string;
  releaseTitle: string;           // e.g. "What's new in March"
  intro?: string;                 // optional paragraph before the feature list
  features: FeatureItem[];
  ctaLabel?: string;              // defaults to "See what's new"
  ctaUrl?: string;
  pixelUrl?: string;
  unsubUrl?: string;
}

const defaultCtaUrl = process.env.FRONTEND_URL ?? 'https://elementarmory.com';

const featureItem = {
  marginBottom: '16px',
};

const featureTitle = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: '600' as const,
  margin: '0 0 4px',
};

const featureDescription = {
  color: '#6b7280',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0',
};

export function FeatureUpdateEmail({
  name,
  email,
  releaseTitle,
  intro,
  features,
  ctaLabel = "See what's new",
  ctaUrl,
  pixelUrl,
  unsubUrl,
}: FeatureUpdateEmailProps) {
  const href = ctaUrl ?? defaultCtaUrl;
  const greeting = name ? `Hey ${name}` : 'Hey';

  return (
    <Html>
      <Head />
      <Preview>{releaseTitle} — new in Element Armory.</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>{releaseTitle}</Heading>
          <Text style={styles.text}>{greeting},</Text>
          {intro && <Text style={styles.text}>{intro}</Text>}

          <Hr style={styles.hr} />

          {features.map((f, i) => (
            <div key={i} style={featureItem}>
              <Text style={featureTitle}>{f.title}</Text>
              <Text style={featureDescription}>{f.description}</Text>
            </div>
          ))}

          <Hr style={styles.hr} />

          <Section style={styles.buttonContainer}>
            <Link href={href} style={styles.button}>
              {ctaLabel}
            </Link>
          </Section>

          <Text style={styles.text}>
            As always — hit reply if anything feels off or you want something explained.
          </Text>
          <Text style={styles.text}>
            Matt – Element Armory
          </Text>

          <Hr style={styles.hr} />
          <Text style={styles.footerLinks}>
            <Link href={href} style={styles.footerLink}>elementarmory.com</Link>
            {' · '}
            <Link href="mailto:support@elementarmory.com" style={styles.footerLink}>support@elementarmory.com</Link>
          </Text>
          <Text style={styles.footerTagline}>
            Element Armory – Capture UI from any site and rebuild it with AI.
          </Text>
          {unsubUrl && (
            <Text style={styles.footerLinks}>
              <Link href={unsubUrl} style={styles.footerLink}>Unsubscribe</Link>
            </Text>
          )}
          {pixelUrl && <Img src={pixelUrl} width="1" height="1" alt="" />}
        </Container>
      </Body>
    </Html>
  );
}

FeatureUpdateEmail.PreviewProps = {
  name: 'David',
  email: 'david@example.com',
  releaseTitle: "What's new in March",
  intro: 'A few things shipped this month that are worth knowing about.',
  features: [
    {
      title: 'Iframe capture',
      description: 'Elements inside cross-origin iframes can now be captured directly — no manual workaround needed.',
    },
    {
      title: 'CSS variable extraction',
      description: 'Capture output now includes resolved CSS custom properties, so your AI context is complete.',
    },
    {
      title: 'AI rebuild via MCP',
      description: 'Pro users can now connect Element Armory as an MCP tool in Cursor and Claude Desktop for direct AI rebuild.',
    },
  ],
} as FeatureUpdateEmailProps;

export default FeatureUpdateEmail;
