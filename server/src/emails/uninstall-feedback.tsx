import { Body, Container, Head, Heading, Hr, Html, Section, Text } from '@react-email/components';
import * as React from 'react';
import * as styles from './styles.js';

export interface UninstallFeedbackEmailProps {
  reason: string;
  reasonLabel: string;
  comment: string | null;
  submittedAt: string;
}

export function UninstallFeedbackEmail({ reasonLabel, comment, submittedAt }: UninstallFeedbackEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>Uninstall Feedback</Heading>
          <Hr style={styles.hr} />
          <Section>
            <Text style={labelStyle}>Reason</Text>
            <Text style={valueStyle}>{reasonLabel}</Text>
            {comment && (
              <>
                <Text style={labelStyle}>Comment</Text>
                <Text style={messageStyle}>{comment}</Text>
              </>
            )}
          </Section>
          <Hr style={styles.hr} />
          <Text style={styles.footer}>Submitted: {submittedAt}</Text>
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
