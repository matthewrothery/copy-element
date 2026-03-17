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

interface JoinWaitlistEmailProps {
  email?: string;
}

const baseUrl = process.env.PUBLIC_URL
  ? process.env.PUBLIC_URL
  : 'http://localhost:9200';

export const JoinWaitlistEmail = ({
  email,
}: JoinWaitlistEmailProps) => (
  <Html>
    <Head />
    <Preview>
      You're on the waitlist!
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Img
          src={`${baseUrl}/api/public/logo.png?id=EMAIL_ID`}
          width="64"
          height="19"
          alt="Demoly"
        />

        <Text style={styles.title}>
          You're on the waitlist!
        </Text>
        <Section style={styles.section}>
          <Text style={styles.text}>
            Hello,
          </Text>
          <Text style={styles.text}>
            Exciting news! We're launching <strong>How-to Guides</strong> by the end of November, and we'd love for you to be among the first to try it out.
          </Text>

          <Text style={styles.text}>
            Old static content is boring. With Demoly, you can create interactive how-to guides that bring your <strong>product to life</strong>.
          </Text>

          <Text style={styles.text}>
            Embed them on your website, share them with your customers, and watch your engagement skyrocket.
          </Text>

          <Text style={styles.text}>
            There will be a <strong>discount for early adopters</strong>, so keep an eye on your inbox for your exclusive invite.
          </Text>

          {/* <Button style={styles.button} href={`${baseUrl}/invite/${code}`}>Join the team</Button> */}

          <Text style={styles.text}>
            Talk soon!<br />
            Demoly Team
          </Text>

          <Hr style={styles.hr} />

          <Text style={styles.warning}>
            This email was intended for {email}. If you were not expecting to join the waitlist, you may <Link style={styles.textLink} href={`${baseUrl}/api/public/waitlist/unsubscribe/marketing/?email=${encodeURIComponent(email)}`}> unsubscribe</Link>.
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
          If you have any questions, please contact us at <Link style={styles.link} href='mailto:support@demoly.io'>support@demoly.io</Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

JoinWaitlistEmail.PreviewProps = {
  email: 'olivia@demo.com',
} as JoinWaitlistEmailProps;

export default JoinWaitlistEmail;
