import { Body, Container, Head, Heading, Hr, Html, Section, Text } from '@react-email/components';
import * as React from 'react';
import * as styles from './styles.js';

export interface SupportInquiryEmailProps {
  name: string;
  email: string;
  topic: string;
  message: string;
  submittedAt: string;
}

export function SupportInquiryEmail({ name, email, topic, message, submittedAt }: SupportInquiryEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>New Support Request</Heading>
          <Hr style={styles.hr} />
          <Section>
            <Text style={labelStyle}>From</Text>
            <Text style={valueStyle}>{name} &lt;{email}&gt;</Text>
            <Text style={labelStyle}>Topic</Text>
            <Text style={valueStyle}>{topic}</Text>
            <Text style={labelStyle}>Message</Text>
            <Text style={messageStyle}>{message}</Text>
          </Section>
          <Hr style={styles.hr} />
          <Text style={styles.footer}>Submitted: {submittedAt}</Text>
          <Text style={styles.footer}>Reply directly to this email to respond to the user.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const labelStyle = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '16px 0 4px',
};

const valueStyle = {
  color: '#111827',
  fontSize: '16px',
  margin: '0 0 8px',
};

const messageStyle = {
  color: '#111827',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};
