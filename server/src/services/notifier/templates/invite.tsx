import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import {styles} from './styles';

interface InviteEmailProps {
  workspace: string;
  email?: string;
  from: {
    name: string;
    email: string;
  };
  code: string;
}

const baseUrl = process.env.PUBLIC_URL
  ? process.env.PUBLIC_URL
  : 'http://localhost:9200';

export const InviteEmail = ({
  workspace,
  email,
  from,
  code,
}: InviteEmailProps) => (
  <Html>
    <Head />
    <Preview>
      You have been invited to join {workspace} on Demoly.io
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Img
          src={`${baseUrl}/assets/logo.png`}
          width="64"
          height="19"
          alt="Demoly"
        />

        <Text style={styles.title}>
          Join <strong>{workspace}</strong>
        </Text>
        <Section style={styles.section}>
          <Text style={styles.text}>
            Hello,
          </Text>
          <Text style={styles.text}>
            <strong>{from.name}</strong> (<Link style={styles.textLink} href={`mailto:${from.email}`}>{from.email}</Link>) has invited you to join the <strong>{workspace}</strong> team on <strong>Demoly</strong>.
          </Text>

          <Button style={styles.button} href={`${baseUrl}/invite/${code}`}>Join the team</Button>

          <Text style={styles.text}>
            Or copy and paste this URL into your browser: <Link style={styles.textLink} href={`${baseUrl}/invite/${code}`}>{baseUrl}/invite/{code}</Link>
          </Text>

          <Hr style={styles.hr} />

          <Text style={styles.warning}>
            This invitation was intended for {email}. If you were not expecting this invitation, you can ignore this email. If you are concerned about your account's safety, please reply to this email to get in touch with us.
          </Text>
        </Section>

        <Text style={styles.links}>
          <Link style={styles.link} href={baseUrl}>Demoly.io</Link> ・{' '}
          <Link style={styles.link} href='mailto:support@demoly.io'>Contact support</Link>
        </Text>

        <Text style={styles.footer}>
          Demoly - Experience it, don't explain it.
        </Text>

        <Text style={styles.footerInfo}>
          This is an automated email sent to {email} as you were invited to join {workspace} at Demoly.
        </Text>
        <Text style={styles.footerInfo}>
          If you have any questions, please contact us at <Link style={styles.link} href='mailto:support@demoly.io'>support@demoly.io</Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

InviteEmail.PreviewProps = {
  name: 'David',
  email: 'david@demo.com',
  workspace: 'Matt\'s Workspace',
  from: {
    name: 'Matt',
    email: 'matt@example.com',
  },
  code: 'UGmqzxQ2OZAELwdcgoTPk',
} as InviteEmailProps;

export default InviteEmail;
