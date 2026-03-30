import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';
import * as styles from './styles.js';

export interface AccountNudgeEmailProps {
  name?: string;
  email: string;
  ctaUrl?: string;
  pixelUrl?: string;
  unsubUrl?: string;
}

const frontendUrl = process.env.FRONTEND_URL ?? 'https://elementarmory.com';

export function AccountNudgeEmail({ name, ctaUrl, pixelUrl, unsubUrl }: AccountNudgeEmailProps) {
  const href = ctaUrl ?? `${frontendUrl}/sign-in`;
  return (
    <Html>
      <Head />
      <Preview>You've captured 3 elements — sign in to keep them synced across devices.</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>Your captures are saved locally. Sign in to sync them.</Heading>
          <Text style={styles.text}>Hey{name ? ` ${name}` : ''}!</Text>
          <Text style={styles.text}>
            You've captured 3 elements. Right now they're tied to this browser install — if you clear your browser data or switch machines, they're gone.
          </Text>
          <Text style={styles.text}>
            Sign in to link your captures to an account. They'll sync across installs and be accessible from your library on any device.
          </Text>
          <Text style={styles.text}>
            It also unlocks the MCP server and AI prompt features.
          </Text>
          <Section style={styles.buttonContainer}>
            <Link href={href} style={styles.button}>
              Sign in to sync
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

AccountNudgeEmail.PreviewProps = {
  name: 'Alex',
  email: 'alex@example.com',
} as AccountNudgeEmailProps;

export default AccountNudgeEmail;
