import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';
import * as styles from './styles.js';

export interface PostLimitFollowupEmailProps {
  name?: string;
  email: string;
  quotaLimit: number;
  upgradeUrl?: string;
  pixelUrl?: string;
  unsubUrl?: string;
}

const frontendUrl = process.env.FRONTEND_URL ?? 'https://elementarmory.com';

export function PostLimitFollowupEmail({ name, quotaLimit, upgradeUrl, pixelUrl, unsubUrl }: PostLimitFollowupEmailProps) {
  const href = upgradeUrl ?? `${frontendUrl}/billing`;
  return (
    <Html>
      <Head />
      <Preview>You hit your capture limit a couple days ago — here's what's next.</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>Still blocked on captures?</Heading>
          <Text style={styles.text}>Hey{name ? ` ${name}` : ''}!</Text>
          <Text style={styles.text}>
            A couple days ago you hit your {quotaLimit}-capture monthly limit. Your library is still there and accessible — you just can't add new captures until next month.
          </Text>
          <Text style={styles.text}>
            If you're actively using Element Armory, Pro removes the limit entirely. You get:
          </Text>
          <Text style={styles.text}>
            — Unlimited monthly captures{'\n'}
            — AI rebuild with full HTML and CSS context{'\n'}
            — MCP server access from Cursor and Claude Desktop{'\n'}
            — Export to React, JSX, and other frameworks
          </Text>
          <Text style={styles.text}>
            If the timing isn't right, your limit resets at the start of next month automatically.
          </Text>
          <Section style={styles.buttonContainer}>
            <Link href={href} style={styles.button}>
              Upgrade to Pro
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

PostLimitFollowupEmail.PreviewProps = {
  name: 'Alex',
  email: 'alex@example.com',
  quotaLimit: 30,
} as PostLimitFollowupEmailProps;

export default PostLimitFollowupEmail;
