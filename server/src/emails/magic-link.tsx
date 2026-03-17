import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';
import * as styles from './styles.js';

export interface MagicLinkEmailProps {
  url: string;
  email: string;
  pixelUrl?: string;
  unsubUrl?: string;
}

export function MagicLinkEmail({ url, pixelUrl, unsubUrl }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Sign in to Element Armory</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>Sign in to Element Armory</Heading>
          <Text style={styles.text}>Click the link below to sign in. This link will expire in a few minutes.</Text>
          <Section style={styles.buttonContainer}>
            <Link href={url} style={styles.button}>
              Sign in
            </Link>
          </Section>
          <Hr style={styles.hr} />
          <Text style={styles.footer}>If you didn&apos;t request this email, you can ignore it.</Text>
          {unsubUrl && (
            <Text style={styles.footer}>
              <Link href={unsubUrl} style={styles.footerLink}>Unsubscribe</Link>
            </Text>
          )}
          {pixelUrl && <Img src={pixelUrl} width="1" height="1" alt="" />}
        </Container>
      </Body>
    </Html>
  );
}
