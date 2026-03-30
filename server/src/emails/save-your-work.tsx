import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';
import * as styles from './styles.js';

export interface SaveYourWorkEmailProps {
  name?: string;
  email: string;
  quotaUsed: number;
  quotaLimit: number;
  upgradeUrl?: string;
  pixelUrl?: string;
  unsubUrl?: string;
}

const frontendUrl = process.env.FRONTEND_URL ?? 'https://elementarmory.com';

export function SaveYourWorkEmail({ name, quotaUsed, quotaLimit, upgradeUrl, pixelUrl, unsubUrl }: SaveYourWorkEmailProps) {
  const href = upgradeUrl ?? `${frontendUrl}/billing`;
  const remaining = quotaLimit - quotaUsed;
  return (
    <Html>
      <Head />
      <Preview>You've used {quotaUsed.toString()} of {quotaLimit.toString()} captures this month — {remaining.toString()} left.</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>Running low on captures this month.</Heading>
          <Text style={styles.text}>Hey{name ? ` ${name}` : ''}!</Text>
          <Text style={styles.text}>
            You've used {quotaUsed} of your {quotaLimit} captures this month. {remaining} remaining.
          </Text>
          <Text style={styles.text}>
            Your limit resets at the start of next month if you'd prefer to wait. Or upgrade to Pro for unlimited captures:
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
            Matt - Element Armory
          </Text>
          <Hr style={styles.hr} />
          <Text style={styles.footerLinks}>
            <Link href={frontendUrl} style={styles.footerLink}>elementarmory.com</Link>
            {' · '}
            <Link href="mailto:support@elementarmory.com" style={styles.footerLink}>support@elementarmory.com</Link>
          </Text>
          <Text style={styles.footerTagline}>
            Element Armory - Capture UI from any site and rebuild it with AI.
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

SaveYourWorkEmail.PreviewProps = {
  name: 'Alex',
  email: 'alex@example.com',
  quotaUsed: 16,
  quotaLimit: 20,
} as SaveYourWorkEmailProps;

export default SaveYourWorkEmail;
