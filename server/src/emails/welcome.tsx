import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';
import * as styles from './styles.js';

export interface WelcomeEmailProps {
  name?: string;
  email: string;
  pixelUrl?: string;
  ctaUrl?: string;
}

const frontendUrl = process.env.FRONTEND_URL ?? 'https://elementarmory.com';

export function WelcomeEmail({ name, pixelUrl, ctaUrl }: WelcomeEmailProps) {
  const href = ctaUrl ?? frontendUrl;
  return (
    <Html>
      <Head />
      <Preview>Welcome to Element Armory — let&apos;s capture your first element.</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>Welcome to Element Armory</Heading>
          <Text style={styles.text}>Hey{name ? ` ${name}` : ''}!</Text>
          <Text style={styles.text}>
            Element Armory lets you capture UI from any site and rebuild it with AI — clean HTML, JSX, styles, and full context.
          </Text>
          <Text style={styles.text}>
            Install the extension, click any element, and you&apos;re done. Your captures are saved to your library and ready for your AI tools.
          </Text>
          <Section style={styles.buttonContainer}>
            <Link href={href} style={styles.button}>
              Open Element Armory
            </Link>
          </Section>
          <Text style={styles.text}>
            What brought you here? Hit reply — I read every response and it genuinely helps shape where this goes.
          </Text>
          <Text style={styles.text}>
            Matt – Element Armory
          </Text>
          <Text style={{ ...styles.text, fontSize: '14px', color: '#9ca3af' }}>
            P.S. Keep an eye on your inbox — I&apos;ll share tips on getting the most out of your captures.
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
          {pixelUrl && <Img src={pixelUrl} width="1" height="1" alt="" />}
        </Container>
      </Body>
    </Html>
  );
}

WelcomeEmail.PreviewProps = {
  name: 'David',
  email: 'david@example.com',
} as WelcomeEmailProps;

export default WelcomeEmail;
