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

interface WelcomeEmailProps {
  name?: string;
}

const baseUrl = process.env.PUBLIC_URL
  ? process.env.PUBLIC_URL
  : 'http://localhost:9200';

export const WelcomeEmail = ({
  name,
}: WelcomeEmailProps) => (
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
          Welcome to <strong>Demoly</strong> 🎉
        </Text>
        <Section style={styles.section}>
          <Text style={styles.text}>
            Hello{name ? <strong> {name}</strong> : ''}!
          </Text>
          <Text style={styles.text}>
            We are building Demoly to help you <strong>create and share interactive demos that drive results</strong>.
          </Text>

          <Text style={styles.text}>
            Whether it's increasing conversions, improving user onboarding, or showcasing your product, Demoly has you covered.
          </Text>

          <Text style={styles.text}>
            Dive in, explore, and let us know how we can help you succeed.
          </Text>

          <Text style={styles.text}>
            If you have the time, could you let me know why you signed up?
          </Text>

          <Text style={styles.text}>
            Just hit reply and share your thoughts. I'm looking forward to hearing from you.
          </Text>

          <Text style={styles.text}>
            Best regards,<br />
            Matt - Demoly Founder
          </Text>
          <Text style={styles.postFooterText}>
            P.S. Keep an eye on your inbox for tips, updates, and exclusive offers. We've got a lot of exciting things coming your way!
          </Text>
        </Section>

        <Text style={styles.links}>
          <Link style={styles.link} href={baseUrl}>Demoly.io</Link> ・{' '}
          <Link style={styles.link} href='mailto:support@demoly.io'>Contact support</Link>
        </Text>

        <Text style={styles.footer}>
          Demoly - Experience it, don't explain it.
        </Text>
      </Container>
    </Body>
  </Html>
);

WelcomeEmail.PreviewProps = {
  name: 'David',
} as WelcomeEmailProps;

export default WelcomeEmail;
