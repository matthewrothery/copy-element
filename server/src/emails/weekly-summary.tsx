import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';
import * as styles from './styles.js';

export interface WeeklySummaryEmailProps {
  name?: string;
  email: string;
  captureCount: number;
  weekOf: string;         // e.g. "March 10–16"
  libraryUrl?: string;
  pixelUrl?: string;
  unsubUrl?: string;
}

const defaultLibraryUrl = process.env.FRONTEND_URL ?? 'https://elementarmory.com';

const statBox = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const statNumber = {
  color: '#111827',
  fontSize: '48px',
  fontWeight: '700' as const,
  lineHeight: '1',
  margin: '0 0 8px',
};

const statLabel = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

export function WeeklySummaryEmail({
  name,
  email,
  captureCount,
  weekOf,
  libraryUrl,
  pixelUrl,
  unsubUrl,
}: WeeklySummaryEmailProps) {
  const href = libraryUrl ?? defaultLibraryUrl;
  const greeting = name ? `Hey ${name}` : 'Hey';
  const noun = captureCount === 1 ? 'element' : 'elements';

  return (
    <Html>
      <Head />
      <Preview>You captured {captureCount} {noun} this week — keep it up.</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>Your week in captures</Heading>
          <Text style={styles.text}>{greeting} — here&apos;s what you captured the week of {weekOf}.</Text>

          <div style={statBox}>
            <Text style={statNumber}>{captureCount}</Text>
            <Text style={statLabel}>{noun} captured</Text>
          </div>

          {captureCount > 0 ? (
            <Text style={styles.text}>
              Nice work. Your captures are in your library, tagged and ready to use with your AI tools.
            </Text>
          ) : (
            <Text style={styles.text}>
              Quiet week — no captures logged. The extension is ready whenever you need it.
            </Text>
          )}

          <Section style={styles.buttonContainer}>
            <Link href={href} style={styles.button}>
              View library
            </Link>
          </Section>

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

WeeklySummaryEmail.PreviewProps = {
  name: 'David',
  email: 'david@example.com',
  captureCount: 7,
  weekOf: 'March 10–16',
} as WeeklySummaryEmailProps;

export default WeeklySummaryEmail;
