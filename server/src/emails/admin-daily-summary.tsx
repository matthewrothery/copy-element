import { Body, Container, Head, Heading, Hr, Html, Section, Text } from '@react-email/components';
import * as React from 'react';
import * as styles from './styles.js';

export interface AdminDailySummaryItem {
  label: string;
  detail: string;
}

export interface AdminDailySummaryEmailProps {
  periodLabel: string;
  installs: number;
  captures: number;
  uniqueCapturingInstalls: number;
  linkedInstalls: number;
  recentInstalls: AdminDailySummaryItem[];
  recentCaptures: AdminDailySummaryItem[];
}

export function AdminDailySummaryEmail({
  periodLabel,
  installs,
  captures,
  uniqueCapturingInstalls,
  linkedInstalls,
  recentInstalls,
  recentCaptures,
}: AdminDailySummaryEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>Element Armory daily activity</Heading>
          <Text style={styles.text}>{periodLabel}</Text>
          <Hr style={styles.hr} />

          <Section>
            <Text style={metricStyle}>New installs: {installs}</Text>
            <Text style={metricStyle}>Captures: {captures}</Text>
            <Text style={metricStyle}>Capturing installs: {uniqueCapturingInstalls}</Text>
            <Text style={metricStyle}>Linked installs: {linkedInstalls}</Text>
          </Section>

          <Hr style={styles.hr} />
          <SummaryList title="Recent installs" items={recentInstalls} empty="No installs in this window." />
          <Hr style={styles.hr} />
          <SummaryList title="Recent captures" items={recentCaptures} empty="No captures in this window." />
        </Container>
      </Body>
    </Html>
  );
}

function SummaryList({
  title,
  items,
  empty,
}: {
  title: string;
  items: AdminDailySummaryItem[];
  empty: string;
}) {
  return (
    <Section>
      <Text style={sectionTitleStyle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.text}>{empty}</Text>
      ) : (
        items.map((item) => (
          <Text key={`${item.label}-${item.detail}`} style={itemStyle}>
            <strong>{item.label}</strong>
            <br />
            {item.detail}
          </Text>
        ))
      )}
    </Section>
  );
}

const metricStyle = {
  color: '#111827',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 8px',
};

const sectionTitleStyle = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '600' as const,
  margin: '0 0 12px',
};

const itemStyle = {
  color: '#111827',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 12px',
};
