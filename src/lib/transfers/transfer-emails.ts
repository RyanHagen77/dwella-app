// =============================================================================
// lib/transfers/transfer-emails.ts
// =============================================================================

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mydwella.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Dwella <noreply@mydwella.com>';

// Shared dark theme email styles
const emailStyles = {
  container: `
    background-color: #0a0a0a;
    color: #f5f5f5;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 40px 20px;
    margin: 0;
  `,
  card: `
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 32px;
    max-width: 560px;
    margin: 0 auto;
    backdrop-filter: blur(10px);
  `,
  heading: `
    color: #ffffff;
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 8px 0;
    letter-spacing: -0.02em;
  `,
  subheading: `
    color: #a1a1a1;
    font-size: 14px;
    margin: 0 0 24px 0;
  `,
  text: `
    color: #e5e5e5;
    font-size: 15px;
    line-height: 1.6;
    margin: 0 0 16px 0;
  `,
  meta: `
    color: #737373;
    font-size: 13px;
    line-height: 1.5;
  `,
  button: `
    display: inline-block;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: #ffffff !important;
    text-decoration: none;
    padding: 14px 28px;
    border-radius: 10px;
    font-weight: 500;
    font-size: 15px;
    margin: 8px 8px 8px 0;
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
  `,
  buttonSecondary: `
    display: inline-block;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: #ffffff !important;
    text-decoration: none;
    padding: 14px 28px;
    border-radius: 10px;
    font-weight: 500;
    font-size: 15px;
    margin: 8px 8px 8px 0;
  `,
  homeCard: `
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 20px;
    margin: 24px 0;
  `,
  homeName: `
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 4px 0;
  `,
  homeAddress: `
    color: #a1a1a1;
    font-size: 14px;
    margin: 0;
  `,
  divider: `
    border: none;
    border-top: 1px solid rgba(255,255,255,0.1);
    margin: 24px 0;
  `,
  footer: `
    color: #525252;
    font-size: 12px;
    text-align: center;
    margin-top: 32px;
  `,
  messageBox: `
    background: rgba(59, 130, 246, 0.1);
    border-left: 3px solid #3b82f6;
    padding: 16px;
    border-radius: 0 8px 8px 0;
    margin: 16px 0;
  `,
  messageText: `
    color: #e5e5e5;
    font-size: 14px;
    font-style: italic;
    margin: 0;
  `,
};

interface TransferInviteEmailParams {
  recipientEmail: string;
  senderName: string;
  homeName: string;
  homeAddress: string;
  message?: string;
  token: string;
  expiresAt: Date;
  hasAccount: boolean;
}

/**
 * Send transfer invitation email to recipient
 */
export async function sendTransferInviteEmail(params: TransferInviteEmailParams) {
  const {
    recipientEmail,
    senderName,
    homeName,
    homeAddress,
    message,
    token,
    expiresAt,
    hasAccount,
  } = params;

  const acceptUrl = `${APP_URL}/transfer/accept?token=${token}`;
  const loginUrl = `${APP_URL}/login?redirect=${encodeURIComponent(`/transfer/accept?token=${token}`)}`;
  const signupUrl = `${APP_URL}/signup?redirect=${encodeURIComponent(`/transfer/accept?token=${token}`)}&email=${encodeURIComponent(recipientEmail)}`;

  const expiresDate = expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home Ownership Transfer</title>
</head>
<body style="${emailStyles.container}">
  <div style="${emailStyles.card}">
    <h1 style="${emailStyles.heading}">🏠 Home Transfer Invitation</h1>
    <p style="${emailStyles.subheading}">You've been invited to receive ownership of a home</p>
    
    <p style="${emailStyles.text}">
      <strong>${senderName}</strong> would like to transfer ownership of their home to you on Dwella.
    </p>
    
    <div style="${emailStyles.homeCard}">
      <p style="${emailStyles.homeName}">${homeName}</p>
      <p style="${emailStyles.homeAddress}">${homeAddress}</p>
    </div>
    
    ${message ? `
    <div style="${emailStyles.messageBox}">
      <p style="${emailStyles.messageText}">"${message}"</p>
    </div>
    ` : ''}
    
    <p style="${emailStyles.text}">
      By accepting this transfer, you'll receive:
    </p>
    <ul style="${emailStyles.text}">
      <li>Full ownership and access to the home profile</li>
      <li>All warranties, records, and documents</li>
      <li>Connected contractor relationships</li>
      <li>Maintenance reminders and history</li>
    </ul>
    
    <hr style="${emailStyles.divider}">
    
    <div style="text-align: center; margin: 24px 0;">
      ${hasAccount ? `
        <a href="${acceptUrl}" style="${emailStyles.button}">Accept Transfer</a>
      ` : `
        <p style="${emailStyles.meta}; margin-bottom: 16px;">Create an account or log in to accept this transfer:</p>
        <a href="${signupUrl}" style="${emailStyles.button}">Create Account & Accept</a>
        <a href="${loginUrl}" style="${emailStyles.buttonSecondary}">Log In & Accept</a>
      `}
    </div>
    
    <p style="${emailStyles.meta}">
      This transfer invitation expires on <strong>${expiresDate}</strong>.
      If you don't want to receive this home, you can simply ignore this email.
    </p>
    
    <hr style="${emailStyles.divider}">
    
    <p style="${emailStyles.footer}">
      This email was sent by Dwella on behalf of ${senderName}.<br>
      If you didn't expect this email, you can safely ignore it.
    </p>
  </div>
</body>
</html>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: recipientEmail,
    subject: `🏠 ${senderName} wants to transfer home ownership to you`,
    html,
  });
}

interface TransferAcceptedEmailParams {
  previousOwnerEmail: string;
  previousOwnerName?: string;
  newOwnerEmail: string;
  newOwnerName?: string;
  homeName: string;
  homeAddress: string;
}

/**
 * Send confirmation emails after transfer is accepted
 */
export async function sendTransferAcceptedEmail(params: TransferAcceptedEmailParams) {
  const {
    previousOwnerEmail,
    newOwnerEmail,
    newOwnerName,
    homeName,
    homeAddress,
  } = params;

  // Email to previous owner
  const previousOwnerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home Transfer Complete</title>
</head>
<body style="${emailStyles.container}">
  <div style="${emailStyles.card}">
    <h1 style="${emailStyles.heading}">✅ Transfer Complete</h1>
    <p style="${emailStyles.subheading}">Home ownership has been successfully transferred</p>
    
    <p style="${emailStyles.text}">
      ${newOwnerName || 'The recipient'} has accepted the transfer of your home.
    </p>
    
    <div style="${emailStyles.homeCard}">
      <p style="${emailStyles.homeName}">${homeName}</p>
      <p style="${emailStyles.homeAddress}">${homeAddress}</p>
    </div>
    
    <p style="${emailStyles.text}">
      This home has been removed from your Dwella account. All records, warranties, 
      and connected contractors have been transferred to the new owner.
    </p>
    
    <hr style="${emailStyles.divider}">
    
    <div style="text-align: center;">
      <a href="${APP_URL}/home" style="${emailStyles.button}">View Your Homes</a>
    </div>
    
    <p style="${emailStyles.footer}">
      Thank you for using Dwella to manage your home.<br>
      We're here if you need us for your other properties.
    </p>
  </div>
</body>
</html>
  `;

  // Email to new owner
  const newOwnerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Your New Home</title>
</head>
<body style="${emailStyles.container}">
  <div style="${emailStyles.card}">
    <h1 style="${emailStyles.heading}">🎉 Welcome to Your New Home!</h1>
    <p style="${emailStyles.subheading}">The transfer is complete</p>
    
    <p style="${emailStyles.text}">
      Congratulations! You are now the owner of this home on Dwella.
    </p>
    
    <div style="${emailStyles.homeCard}">
      <p style="${emailStyles.homeName}">${homeName}</p>
      <p style="${emailStyles.homeAddress}">${homeAddress}</p>
    </div>
    
    <p style="${emailStyles.text}">
      You now have access to:
    </p>
    <ul style="${emailStyles.text}">
      <li>Complete home profile and details</li>
      <li>All warranties and their documentation</li>
      <li>Maintenance records and history</li>
      <li>Connected contractors and service providers</li>
      <li>Photos and documents</li>
    </ul>
    
    <hr style="${emailStyles.divider}">
    
    <div style="text-align: center;">
      <a href="${APP_URL}/home" style="${emailStyles.button}">View Your Home</a>
    </div>
    
    <p style="${emailStyles.footer}">
      Welcome to Dwella! We're excited to help you<br>
      manage and maintain your home.
    </p>
  </div>
</body>
</html>
  `;

  // Send both emails
  await Promise.all([
    resend.emails.send({
      from: FROM_EMAIL,
      to: previousOwnerEmail,
      subject: `✅ Home transfer complete - ${homeName}`,
      html: previousOwnerHtml,
    }),
    resend.emails.send({
      from: FROM_EMAIL,
      to: newOwnerEmail,
      subject: `🎉 Welcome to your new home - ${homeName}`,
      html: newOwnerHtml,
    }),
  ]);
}

interface ContractorNotificationParams {
  contractors: Array<{
    email: string;
    businessName: string;
  }>;
  homeName: string;
  homeAddress: string;
  newOwnerName: string;
}

/**
 * Notify contractors of ownership change
 */
export async function sendTransferNotificationToContractors(params: ContractorNotificationParams) {
  const { contractors, homeName, homeAddress, newOwnerName } = params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home Ownership Update</title>
</head>
<body style="${emailStyles.container}">
  <div style="${emailStyles.card}">
    <h1 style="${emailStyles.heading}">🏠 Ownership Change Notice</h1>
    <p style="${emailStyles.subheading}">A home you're connected to has a new owner</p>
    
    <div style="${emailStyles.homeCard}">
      <p style="${emailStyles.homeName}">${homeName}</p>
      <p style="${emailStyles.homeAddress}">${homeAddress}</p>
    </div>
    
    <p style="${emailStyles.text}">
      This home has been transferred to <strong>${newOwnerName}</strong>. 
      Your connection to this property and your work history remain intact.
    </p>
    
    <p style="${emailStyles.text}">
      The new owner can view your previous work on this property and may reach out 
      for future projects. No action is required on your part.
    </p>
    
    <hr style="${emailStyles.divider}">
    
    <div style="text-align: center;">
      <a href="${APP_URL}/pro/dashboard" style="${emailStyles.button}">View Dashboard</a>
    </div>
    
    <p style="${emailStyles.footer}">
      This is an automated notification from Dwella.<br>
      You're receiving this because you have an active connection to this property.
    </p>
  </div>
</body>
</html>
  `;

  // Send to all contractors (in parallel, but with some error handling)
  await Promise.allSettled(
    contractors.map((contractor) =>
      resend.emails.send({
        from: FROM_EMAIL,
        to: contractor.email,
        subject: `🏠 Ownership change at ${homeAddress}`,
        html,
      })
    )
  );
}

interface TransferCancelledEmailParams {
  recipientEmail: string;
  senderName: string;
  homeName: string;
  homeAddress: string;
}

/**
 * Notify recipient that transfer was cancelled
 */
export async function sendTransferCancelledEmail(params: TransferCancelledEmailParams) {
  const { recipientEmail, senderName, homeName, homeAddress } = params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transfer Cancelled</title>
</head>
<body style="${emailStyles.container}">
  <div style="${emailStyles.card}">
    <h1 style="${emailStyles.heading}">Transfer Cancelled</h1>
    <p style="${emailStyles.subheading}">A pending transfer has been cancelled</p>
    
    <p style="${emailStyles.text}">
      <strong>${senderName}</strong> has cancelled the transfer of:
    </p>
    
    <div style="${emailStyles.homeCard}">
      <p style="${emailStyles.homeName}">${homeName}</p>
      <p style="${emailStyles.homeAddress}">${homeAddress}</p>
    </div>
    
    <p style="${emailStyles.text}">
      No action is required on your part. If you have questions, please contact 
      the homeowner directly.
    </p>
    
    <p style="${emailStyles.footer}">
      This is an automated notification from Dwella.
    </p>
  </div>
</body>
</html>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: recipientEmail,
    subject: `Home transfer cancelled - ${homeName}`,
    html,
  });
}