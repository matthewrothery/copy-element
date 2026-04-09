import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';
import * as styles from './styles.js';

export interface LimitReachedEmailProps {
  name?: string;
  email: string;
  quotaLimit: number;
  upgradeUrl?: string;
  pixelUrl?: string;
  unsubUrl?: string;
}

const frontendUrl = process.env.FRONTEND_URL ?? 'https://elementarmory.com';

export function LimitReachedEmail({ name, quotaLimit, upgradeUrl, pixelUrl, unsubUrl }: LimitReachedEmailProps) {
  const href = upgradeUrl ?? `${frontendUrl}/billing`;
  return (
    <Html>
      <Head />
      <Preview>You've used all {quotaLimit.toString()} captures this month — upgrade for unlimited access.</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>You've hit your monthly limit.</Heading>
          <Text style={styles.text}>Hey{name ? ` ${name}` : ''}!</Text>
          <Text style={styles.text}>
            You've used all {quotaLimit} captures for this month. Your library is still accessible — you just won't be able to add new captures until the limit resets.
          </Text>
          <Text style={styles.text}>
            Upgrade to Pro for unlimited captures, plus:
          </Text>
          <Text style={styles.text}>
            — Unlimited monthly captures{'\n'}
            — AI rebuild with full HTML and CSS context{'\n'}
            — MCP server access from Cursor and Claude Desktop{'\n'}
            — Export to React, JSX, and other frameworks
          </Text>
          <Section style={styles.buttonContainer}>
            <Link href={href} style={styles.button}>
              Upgrade to Pro
            </Link>
          </Section>
          <Text style={styles.text}>
            Your limit resets at the start of next month if you'd prefer to wait.
          </Text>
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

LimitReachedEmail.PreviewProps = {
  name: 'Alex',
  email: 'alex@example.com',
  quotaLimit: 30,
} as LimitReachedEmailProps;

export default LimitReachedEmail;
