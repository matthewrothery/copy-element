import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';
import * as styles from './styles.js';

export interface ReactivationEmailProps {
  name?: string;
  email: string;
  daysSinceLastCapture: number;   // 14 or 30
  libraryUrl?: string;
  pixelUrl?: string;
  unsubUrl?: string;
}

const defaultLibraryUrl = process.env.FRONTEND_URL ?? 'https://elementarmory.com';

export function ReactivationEmail({
  name,
  email,
  daysSinceLastCapture,
  libraryUrl,
  pixelUrl,
  unsubUrl,
}: ReactivationEmailProps) {
  const href = libraryUrl ?? defaultLibraryUrl;
  const greeting = name ? `Hey ${name}` : 'Hey';
  const window = daysSinceLastCapture >= 30 ? 'a month' : 'a couple of weeks';

  return (
    <Html>
      <Head />
      <Preview>Still there? You haven&apos;t captured anything in {window}.</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>Still there?</Heading>
          <Text style={styles.text}>
            {greeting} — it&apos;s been {window} since your last capture. Just checking in.
          </Text>
          <Text style={styles.text}>
            The extension is still installed and waiting. If you&apos;ve hit any friction —
            a site that didn&apos;t capture cleanly, or something confusing in the output —
            hit reply and let me know. I fix these fast.
          </Text>
          <Text style={styles.text}>
            Otherwise, whenever you&apos;re ready:
          </Text>
          <Section style={styles.buttonContainer}>
            <Link href={href} style={styles.button}>
              Open Element Armory
            </Link>
          </Section>
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

ReactivationEmail.PreviewProps = {
  name: 'David',
  email: 'david@example.com',
  daysSinceLastCapture: 14,
} as ReactivationEmailProps;

export default ReactivationEmail;
