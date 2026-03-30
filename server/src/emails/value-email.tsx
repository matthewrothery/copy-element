import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';
import * as styles from './styles.js';

export interface ValueEmailProps {
  name?: string;
  email: string;
  ctaUrl?: string;
  pixelUrl?: string;
  unsubUrl?: string;
}

const frontendUrl = process.env.FRONTEND_URL ?? 'https://elementarmory.com';

export function ValueEmail({ name, ctaUrl, pixelUrl, unsubUrl }: ValueEmailProps) {
  const href = ctaUrl ?? `${frontendUrl}/app/library`;
  return (
    <Html>
      <Head />
      <Preview>Three ways Element Armory saves you time in real workflows.</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>Three workflows that save the most time.</Heading>
          <Text style={styles.text}>Hey{name ? ` ${name}` : ''}!</Text>
          <Text style={styles.text}>
            You've been using Element Armory for a few days. Here are three ways people get the most out of it:
          </Text>
          <Text style={styles.text}>
            <strong>1. AI-assisted rebuilds.</strong> Open any capture, hit "Copy prompt," and paste it into Claude or ChatGPT. The prompt includes the full HTML, computed styles, and layout context — the AI gets clean output on the first try, not a rough approximation.
          </Text>
          <Text style={styles.text}>
            <strong>2. MCP context in Cursor or Claude Desktop.</strong> Connect your library as an MCP server. Your captures become live context in your AI coding session — no copy-pasting required. Setup takes under a minute from the account page.
          </Text>
          <Text style={styles.text}>
            <strong>3. A personal component reference.</strong> Capture buttons, cards, nav patterns, and form styles as you browse. Your library builds into a searchable reference of real-world UI you can pull from while building.
          </Text>
          <Section style={styles.buttonContainer}>
            <Link href={href} style={styles.button}>
              Open your library
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

ValueEmail.PreviewProps = {
  name: 'Alex',
  email: 'alex@example.com',
} as ValueEmailProps;

export default ValueEmail;
