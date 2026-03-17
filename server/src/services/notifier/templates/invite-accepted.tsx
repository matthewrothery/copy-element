import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import {styles} from './styles';

interface InviteAcceptedEmailProps {
  workspace: string;
  name?: string;
  recipient: string;
}

const baseUrl = process.env.PUBLIC_URL
  ? process.env.PUBLIC_URL
  : 'http://localhost:9200';

export const InviteAcceptedEmail = ({
  workspace,
  name,
  recipient,
}: InviteAcceptedEmailProps) => (
  <Html>
    <Head />
    <Preview>
      Hey! I have a quick question.
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
          Welcome to <strong>{workspace}</strong>
        </Text>
        <Section style={styles.section}>
          <Text style={styles.text}>
            Hey{name ? <strong> {name}</strong> : ''}!
          </Text>
          <Text style={styles.text}>
            You are now part of the <strong>{workspace}</strong> team on Demoly. Welcome aboard 🎉
          </Text>

          <Text style={styles.text}>
            At Demoly, our mission is simple: to help you <strong>create and share interactive demos</strong> that drive results. Whether it's increasing conversions, improving user onboarding, or showcasing your product, Demoly has you covered.
          </Text>

          <Text style={styles.text}>
          Here are a few features to get you started:
          </Text>

          <ul style={styles.list}>
            <li style={styles.listItem}><strong>Interactive Demos</strong>: Easily create engaging demos to highlight your product's best features.</li>
            <li style={styles.listItem}><strong>User Onboarding:</strong>: Simplify the onboarding process for new users with step-by-step guides.</li>
            <li style={styles.listItem}><strong>Analytics</strong>: Track engagement and gather insights to optimize your demos.</li>
            <li style={styles.listItem}><strong>Customization</strong>: Tailor your demos to match your brand and style.</li>
          </ul>

          <Text style={styles.text}>
            Have fun!<br />
            Demoly Team
          </Text>
          <Text style={styles.postFooterText}>
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
          This is an automated email because this email address accepted an invitation to join {workspace} at Demoly.<br />
        </Text>
        <Text style={styles.footerInfo}>
          If you have any questions, please contact us at <Link style={styles.link} href='mailto:support@demoly.io'>support@demoly.io</Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

InviteAcceptedEmail.PreviewProps = {
  workspace: 'Matt\'s Workspace',
  name: 'Olivia',
  recipient: 'dave@website.com',
} as InviteAcceptedEmailProps;

export default InviteAcceptedEmail;
