import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';
import * as styles from './styles.js';

export interface FirstCaptureEmailProps {
  name?: string;
  email: string;
  libraryUrl?: string;
  pixelUrl?: string;
  unsubUrl?: string;
}

const frontendUrl = process.env.FRONTEND_URL ?? 'https://elementarmory.com';

export function FirstCaptureEmail({ name, libraryUrl, pixelUrl, unsubUrl }: FirstCaptureEmailProps) {
  const href = libraryUrl ?? `${frontendUrl}/app/library`;
  return (
    <Html>
      <Head />
      <Preview>You captured your first element — here's what to do next.</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>Your first capture is saved.</Heading>
          <Text style={styles.text}>Hey{name ? ` ${name}` : ''}!</Text>
          <Text style={styles.text}>
            You just captured your first element. It's in your library — clean HTML and JSX, ready to paste or use with your AI tools.
          </Text>
          <Text style={styles.text}>
            A few things worth knowing:
          </Text>
          <Text style={styles.text}>
            <strong>Copy HTML or JSX</strong> — open your library, click any capture, and copy the format you need. Inline styles only, no dependencies.
          </Text>
          <Text style={styles.text}>
            <strong>Use with AI</strong> — open a capture and hit "Copy prompt." Paste it directly into Claude, ChatGPT, or any AI chat. The prompt includes the full HTML, styles, and context.
          </Text>
          <Text style={styles.text}>
            <strong>MCP server</strong> — if you use Cursor or Claude Desktop, connect Element Armory as an MCP tool. Your captures become live context in your AI session. Setup takes under a minute.
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

FirstCaptureEmail.PreviewProps = {
  name: 'Alex',
  email: 'alex@example.com',
} as FirstCaptureEmailProps;

export default FirstCaptureEmail;
