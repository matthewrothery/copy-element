import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';
import * as styles from './styles.js';

export interface OnboardingReminderEmailProps {
  name?: string;
  email: string;
  ctaUrl?: string;
  pixelUrl?: string;
  unsubUrl?: string;
}

const frontendUrl = process.env.FRONTEND_URL ?? 'https://elementarmory.com';

export function OnboardingReminderEmail({ name, ctaUrl, pixelUrl, unsubUrl }: OnboardingReminderEmailProps) {
  const href = ctaUrl ?? `${frontendUrl}/app/library`;
  return (
    <Html>
      <Head />
      <Preview>You signed up for Element Armory — here's how to get started.</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>Get your first capture in under a minute.</Heading>
          <Text style={styles.text}>Hey{name ? ` ${name}` : ''}!</Text>
          <Text style={styles.text}>
            You signed up for Element Armory yesterday. If you haven't captured anything yet, here's how to start:
          </Text>
          <Text style={styles.text}>
            <strong>1. Open any site in Chrome.</strong> Click the Element Armory extension icon.
          </Text>
          <Text style={styles.text}>
            <strong>2. Hover over any UI element.</strong> A blue outline shows what you're about to capture.
          </Text>
          <Text style={styles.text}>
            <strong>3. Click to capture.</strong> Clean HTML and JSX are saved to your library instantly.
          </Text>
          <Text style={styles.text}>
            From there you can copy the code, use it with an AI tool, or connect it as an MCP context source.
          </Text>
          <Section style={styles.buttonContainer}>
            <Link href={href} style={styles.button}>
              Open your library
            </Link>
          </Section>
          <Text style={styles.text}>
            Matt – Element Armory
          </Text>
          <Hr style={styles.hr} />
          <Text style={styles.footerLinks}>
            <Link href={frontendUrl} style={styles.footerLink}>elementarmory.com</Link>
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

OnboardingReminderEmail.PreviewProps = {
  name: 'Alex',
  email: 'alex@example.com',
} as OnboardingReminderEmailProps;

export default OnboardingReminderEmail;
