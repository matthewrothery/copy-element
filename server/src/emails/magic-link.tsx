import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';

export interface MagicLinkEmailProps {
  url: string;
  email: string;
}

export function MagicLinkEmail({ url, email }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Sign in to Element Armory</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Sign in to Element Armory</Heading>
          <Text style={text}>Click the link below to sign in. This link will expire in a few minutes.</Text>
          <Section style={buttonContainer}>
            <Link href={url} style={button}>
              Sign in
            </Link>
          </Section>
          <Text style={footer}>If you didn&apos;t request this email, you can ignore it.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '24px',
  maxWidth: '480px',
};

const h1 = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: '600' as const,
  margin: '0 0 16px',
};

const text = {
  color: '#6b7280',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 24px',
};

const buttonContainer = {
  margin: '0 0 24px',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600' as const,
  padding: '12px 24px',
  textDecoration: 'none',
};

const footer = {
  color: '#9ca3af',
  fontSize: '14px',
  margin: '0',
};
