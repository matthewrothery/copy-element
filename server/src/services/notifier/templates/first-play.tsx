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

interface FirstPlayEmailProps {
  name?: string;
}

const baseUrl = process.env.PUBLIC_URL
  ? process.env.PUBLIC_URL
  : 'http://localhost:9200';

export const FirstPlayEmail = ({
  name,
}: FirstPlayEmailProps) => (
  <Html>
    <Head />
    <Preview>
      Someone has played your demo!
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
          Someone has played your demo!
        </Text>
        <Section style={styles.section}>
          <Text style={styles.text}>
            Hey{name ? <strong> {name}</strong> : ''}!
          </Text>
          <Text style={styles.text}>
            Exciting news! Your demo has just been played for the first time. 🎉
          </Text>

          <Text style={styles.text}>
          This is the moment you&apos;ve been waiting for—your interactive experience is out in the world, showing its magic to others.
          </Text>

          <Text style={styles.text}>
            Curious to see how it went? Check out the activity in your account <Link href={`${baseUrl}/analytics`}>here</Link>.
          </Text>

          <Text style={styles.text}>
            You'll find all the details on views, interactions, and more to help you understand how your demo is performing.
          </Text>

          <Text style={styles.text}>
            If you need any tips or have questions, we&apos;re just a reply away!
          </Text>

          <Text style={styles.text}>
            Happy sharing!
          </Text>

          <Text style={styles.text}>
            Best regards,<br />
            The Demoly Team
          </Text>
          {/* <Text style={styles.postFooterText}>
            P.S. Keep an eye on your inbox for tips, updates, and exclusive offers. We've got a lot of exciting things coming your way!
          </Text> */}
        </Section>

        <Text style={styles.links}>
          <Link style={styles.link} href={baseUrl}>Demoly.io</Link> ・{' '}
          <Link style={styles.link} href='mailto:support@demoly.io'>Contact support</Link>
        </Text>

        <Text style={styles.footer}>
          Demoly - Experience it, don't explain it.
        </Text>

        {/* <Text style={styles.footer}>
          <Link href="" style={styles.unsubscribe}>Unsubscribe</Link>
        </Text> */}
      </Container>
    </Body>
  </Html>
);

FirstPlayEmail.PreviewProps = {
  name: 'Olivia',
};

export default FirstPlayEmail;
