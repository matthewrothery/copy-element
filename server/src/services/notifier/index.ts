import AWS from 'aws-sdk';
import { render } from '@react-email/render';
import WelcomeEmail from './templates/welcome';
import WaitlistWelcomeEmail from './templates/waitlist-welcome';
import { InviteAcceptedEmail } from './templates/invite-accepted';
import InviteEmail from './templates/invite';
import FirstPlayEmail from './templates/first-play';
import models from '../../models';
import { v4 } from 'uuid';

AWS.config.update({ region: process.env.AWS_SES_REGION });

export const sendEmail = async (
  recipient: string,
  subject: string,
  message: string,
  source?: { name: string; email: string },
) => {
  // For more parameters and docs see: https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/ses-examples-sending-email.html
  const id = v4();
  const params = {
    Destination: {
      ToAddresses: [
        recipient,
      ],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: message.replace(/EMAIL_ID/g, id),
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
    },
    Source: source ? `${source.name}<${source.email}>` : `Demoly Team<${process.env.AWS_SES_FROM_EMAIL}>`,
    ReplyToAddresses: [
      source ? source.email : process.env.AWS_SES_FROM_EMAIL,
    ],
  };

  console.log('send email params', params);

  // Create the promise and SES service object
  try {
    await new AWS.SES({ region: process.env.AWS_SES_REGION }).sendEmail(params).promise();
    console.log(`Email successfully sent to ${recipient}`);

    // Log send history
    await models.emailList.logEmailHistory({
      id,
      email: recipient,
      type: 'transactional',
      template: 'email',
    });

  } catch (e) {
    console.log(e);
    console.log(`Email failed to send to ${recipient}`);
  }
};

export const sendWelcomeEmail = async (args: { recipient: string, name: string }) => {
  const { recipient, name } = args;
  const message = render(WelcomeEmail({ name }));
  const subject = `${name ? `${name},` : 'Hello!'} Thrilled to Have You on Board! Quick Question for You 😊`;
  await sendEmail(recipient, subject, message, { name: 'Matt - Demoly.io', email: 'matt@demoly.io' });

  // We had a sign up, I'm excited!
  await sendEmail('matt@demoly.io', 'New Sign Up!', `New sign up from ${recipient}`);
};

export const sendInviteEmail = async (args: { recipient: string; inviteFrom: { name: string; email: string; }, workspaceName: string; code: string;}) => {
  const { recipient, workspaceName, inviteFrom, code } = args;
  const message = render(InviteEmail({
    workspace: workspaceName,
    email: recipient,
    from: { name: inviteFrom.name, email: inviteFrom.email },
    code,
  }));
  const subject = `You have been invited to join ${workspaceName}`;
  await sendEmail(recipient, subject, message);

  // We had a sign up, I'm excited!
  await sendEmail('matt@demoly.io', 'New Invitation!', `New Invitation up to: ${recipient} from ${inviteFrom.email}`);
};

export const sendInviteAcceptedEmail = async (args: { recipient: string, name: string; workspace: string; }) => {
  const { recipient, name, workspace } = args;
  const message = render(InviteAcceptedEmail({ workspace, name, recipient }));
  const subject = `Welcome to ${workspace}!`;
  await sendEmail(recipient, subject, message, { name: 'Demoly.io Team', email: 'team@demoly.io' });
};

export const sendStartupEmail = async (args: { recipient: string, name: string }) => {
  const message = render(WelcomeEmail({ name: args.name }));
  const { recipient, name } = args;
  const subject = `${name ? `${name},` : 'Hello!'} Thrilled to Have You on Board! Quick Question for You 😊`;
  await sendEmail(recipient, subject, message, { name: 'Matt - Demoly.io', email: 'matt@demoly.io' });
};

export const sendFirstPlayEmail = async (args: { recipient: string, name: string; }) => {
  const { recipient, name } = args;
  const message = render(FirstPlayEmail({ name }));
  const subject = 'You have had a viewer! 🥳';
  await sendEmail(recipient, subject, message, { name: 'Demoly.io Team', email: 'team@demoly.io' });
};

export const sendWaitlistWelcomeEmail = async (args: { recipient: string }) => {
  const { recipient } = args;
  const message = render(WaitlistWelcomeEmail({ email: recipient }));
  const subject = 'You have joined the waitlist!';
  await sendEmail(recipient, subject, message, { name: 'Demoly.io Team', email: 'team@demoly.io' });

  // We had a sign up, I'm excited!
  await sendEmail('matt@demoly.io', 'Someone jonied the waitlist!', `Member: ${recipient}`);
};

export const notifierServices = {
  sendEmail,
  sendWelcomeEmail,
  sendInviteEmail,
  sendInviteAcceptedEmail,
  sendFirstPlayEmail,
  sendStartupEmail,
  sendWaitlistWelcomeEmail,
};
