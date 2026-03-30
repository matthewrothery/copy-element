import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';
import * as styles from './styles.js';

export interface CaptureMilestoneEmailProps {
  name?: string;
  email: string;
  ctaUrl?: string;
  pixelUrl?: string;
  unsubUrl?: string;
}

const frontendUrl = process.env.FRONTEND_URL ?? 'https://elementarmory.com';

export function CaptureMilestoneEmail({ name, ctaUrl, pixelUrl, unsubUrl }: CaptureMilestoneEmailProps) {
  const href = ctaUrl ?? `${frontendUrl}/app/library`;
  return (
    <Html>
      <Head />
      <Preview>10 captures in your library — here's what you can do with them.</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>10 captures. A real library now.</Heading>
          <Text style={styles.text}>Hey{name ? ` ${name}` : ''}!</Text>
          <Text style={styles.text}>
            You have 10 captures in your library. That's enough to be genuinely useful — patterns for buttons, cards, navs, and forms that you've collected from real sites.
          </Text>
          <Text style={styles.text}>
            A few things worth trying now that your library has some depth:
          </Text>
          <Text style={styles.text}>
            <strong>Use the MCP server.</strong> Connect your library to Cursor or Claude Desktop and your captures become live context in your AI sessions. No more pasting code manually. Setup is on your account page.
          </Text>
          <Text style={styles.text}>
            <strong>Rebuild with AI.</strong> Open any capture, hit "Copy prompt," and paste into your AI tool of choice. The prompt includes full HTML, computed styles, and layout context for clean first-pass output.
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

CaptureMilestoneEmail.PreviewProps = {
  name: 'Alex',
  email: 'alex@example.com',
} as CaptureMilestoneEmailProps;

export default CaptureMilestoneEmail;
