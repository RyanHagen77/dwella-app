// =============================================================================
// lib/transfer/transfer-emails.ts
// =============================================================================
// Email templates for home transfer notifications

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mydwella.com';

// Clean and validate the FROM address (same as lib/email.ts)
const getFromAddress = () => {
  const raw = process.env.EMAIL_FROM || "hello@mydwellaapp.com";
  const cleaned = raw.replace(/^["']|["']$/g, '').trim();

  if (cleaned && !cleaned.includes('<')) {
    return `Dwella <${cleaned}>`;
  }

  return cleaned || "MyDwella Team <hello@mydwellaapp.com>";
};

// Log configuration on first import
console.log('[Transfer Emails] Configuration:', {
  hasApiKey: !!process.env.RESEND_API_KEY,
  appUrl: APP_URL,
  fromEmail: getFromAddress(),
});

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
    margin: 20px 0;
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

  console.log('[Transfer Email] Sending invite email:', {
    to: recipientEmail,
    from: getFromAddress(),
    homeName,
    hasAccount,
  });

  if (!process.env.RESEND_API_KEY) {
    console.error('[Transfer Email] ERROR: RESEND_API_KEY is not set!');
    return;
  }

  const acceptUrl = `${APP_URL}/transfer/accept?token=${token}`;
  const loginUrl = `${APP_URL}/login?redirect=${encodeURIComponent(`/transfer/accept?token=${token}`)}`;
  const signupUrl = `${APP_URL}/register?redirect=${encodeURIComponent(`/transfer/accept?token=${token}`)}&email=${encodeURIComponent(recipientEmail)}`;

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
    
    <div style="margin: 24px 0;">
      ${hasAccount ? `
        <p style="${emailStyles.meta}; margin-bottom: 16px;">Click below to review and accept this transfer:</p>
        <a href="${acceptUrl}" style="${emailStyles.button}">Review Transfer</a>
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

  try {
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: recipientEmail,
      subject: `🏠 ${senderName} wants to transfer home ownership to you`,
      html,
    });
    console.log('[Transfer Email] Invite email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('[Transfer Email] Failed to send invite email:', error);
    throw error;
  }
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

  console.log('[Transfer Email] Sending accepted emails:', {
    previousOwner: previousOwnerEmail,
    newOwner: newOwnerEmail,
    homeName,
  });

  if (!process.env.RESEND_API_KEY) {
    console.error('[Transfer Email] ERROR: RESEND_API_KEY is not set!');
    return;
  }

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
    <p style="${emailStyles.subheading}">Your home has been successfully transferred</p>
    
    <p style="${emailStyles.text}">
      <strong>${newOwnerName || 'The recipient'}</strong> has accepted the transfer of your home.
    </p>
    
    <div style="${emailStyles.homeCard}">
      <p style="${emailStyles.homeName}">${homeName}</p>
      <p style="${emailStyles.homeAddress}">${homeAddress}</p>
    </div>
    
    <p style="${emailStyles.text}">
      All records, warranties, and contractor connections have been transferred to the new owner.
      You no longer have access to this home on MyDwella.
    </p>
    
    <hr style="${emailStyles.divider}">
    
    <p style="${emailStyles.footer}">
      Thank you for using Dwella.<br>
      We hope to see you again with your next home!
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
    <p style="${emailStyles.subheading}">The home transfer is complete</p>
    
    <p style="${emailStyles.text}">
      Congratulations! You are now the owner of this home on MyDwella.
    </p>
    
    <div style="${emailStyles.homeCard}">
      <p style="${emailStyles.homeName}">${homeName}</p>
      <p style="${emailStyles.homeAddress}">${homeAddress}</p>
    </div>
    
    <p style="${emailStyles.text}">
      <strong>What's been transferred to you:</strong>
    </p>
    <ul style="${emailStyles.text}">
      <li>All maintenance records and history</li>
      <li>Warranties and their documentation</li>
      <li>Contractor connections and message history</li>
      <li>Photos and attachments</li>
    </ul>
    
    <div style="margin: 24px 0;">
      <a href="${APP_URL}/home" style="${emailStyles.button}">View Your Home</a>
    </div>
    
    <hr style="${emailStyles.divider}">
    
    <p style="${emailStyles.footer}">
      Welcome to Dwella!<br>
      Your home's digital record awaits.
    </p>
  </div>
</body>
</html>
  `;

  try {
    const results = await Promise.all([
      resend.emails.send({
        from: getFromAddress(),
        to: previousOwnerEmail,
        subject: `✅ Home transfer complete - ${homeName}`,
        html: previousOwnerHtml,
      }),
      resend.emails.send({
        from: getFromAddress(),
        to: newOwnerEmail,
        subject: `🎉 Welcome to your new home - ${homeName}`,
        html: newOwnerHtml,
      }),
    ]);
    console.log('[Transfer Email] Accepted emails sent successfully:', results);
    return results;
  } catch (error) {
    console.error('[Transfer Email] Failed to send accepted emails:', error);
    throw error;
  }
}

interface TransferDeclinedEmailParams {
  previousOwnerEmail: string;
  previousOwnerName?: string;
  recipientEmail: string;
  homeName: string;
  homeAddress: string;
}

/**
 * Send notification when transfer is declined
 */
export async function sendTransferDeclinedEmail(params: TransferDeclinedEmailParams) {
  const {
    previousOwnerEmail,
    recipientEmail,
    homeName,
    homeAddress,
  } = params;

  console.log('[Transfer Email] Sending declined email:', {
    to: previousOwnerEmail,
    homeName,
  });

  if (!process.env.RESEND_API_KEY) {
    console.error('[Transfer Email] ERROR: RESEND_API_KEY is not set!');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home Transfer Declined</title>
</head>
<body style="${emailStyles.container}">
  <div style="${emailStyles.card}">
    <h1 style="${emailStyles.heading}">Transfer Declined</h1>
    <p style="${emailStyles.subheading}">Your home transfer was not accepted</p>
    
    <p style="${emailStyles.text}">
      <strong>${recipientEmail}</strong> has declined your transfer invitation for:
    </p>
    
    <div style="${emailStyles.homeCard}">
      <p style="${emailStyles.homeName}">${homeName}</p>
      <p style="${emailStyles.homeAddress}">${homeAddress}</p>
    </div>
    
    <p style="${emailStyles.text}">
      You still have full ownership and access to this home.
      You can initiate a new transfer at any time from your account settings.
    </p>
    
    <div style="margin: 24px 0;">
      <a href="${APP_URL}/account" style="${emailStyles.button}">Go to Account</a>
    </div>
    
    <hr style="${emailStyles.divider}">
    
    <p style="${emailStyles.footer}">
      This is an automated message from Dwella.
    </p>
  </div>
</body>
</html>
  `;

  try {
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: previousOwnerEmail,
      subject: `Transfer declined - ${homeName}`,
      html,
    });
    console.log('[Transfer Email] Declined email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('[Transfer Email] Failed to send declined email:', error);
    throw error;
  }
}

interface TransferCancelledEmailParams {
  recipientEmail: string;
  senderName: string;
  homeName: string;
  homeAddress: string;
}

/**
 * Send notification when transfer is cancelled by sender
 */
export async function sendTransferCancelledEmail(params: TransferCancelledEmailParams) {
  const {
    recipientEmail,
    senderName,
    homeName,
    homeAddress,
  } = params;

  console.log('[Transfer Email] Sending cancelled email:', {
    to: recipientEmail,
    homeName,
  });

  if (!process.env.RESEND_API_KEY) {
    console.error('[Transfer Email] ERROR: RESEND_API_KEY is not set!');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home Transfer Cancelled</title>
</head>
<body style="${emailStyles.container}">
  <div style="${emailStyles.card}">
    <h1 style="${emailStyles.heading}">Transfer Cancelled</h1>
    <p style="${emailStyles.subheading}">A home transfer invitation has been cancelled</p>
    
    <p style="${emailStyles.text}">
      <strong>${senderName}</strong> has cancelled their transfer invitation for:
    </p>
    
    <div style="${emailStyles.homeCard}">
      <p style="${emailStyles.homeName}">${homeName}</p>
      <p style="${emailStyles.homeAddress}">${homeAddress}</p>
    </div>
    
    <p style="${emailStyles.text}">
      If you were expecting this transfer, please contact ${senderName} directly.
    </p>
    
    <hr style="${emailStyles.divider}">
    
    <p style="${emailStyles.footer}">
      This is an automated message from Dwella.
    </p>
  </div>
</body>
</html>
  `;

  try {
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: recipientEmail,
      subject: `Home transfer cancelled - ${homeName}`,
      html,
    });
    console.log('[Transfer Email] Cancelled email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('[Transfer Email] Failed to send cancelled email:', error);
    throw error;
  }
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
 * Send notification to contractors when home ownership changes
 */
export async function sendTransferNotificationToContractors(params: ContractorNotificationParams) {
  const {
    contractors,
    homeName,
    homeAddress,
    newOwnerName,
  } = params;

  console.log('[Transfer Email] Sending contractor notifications:', {
    contractorCount: contractors.length,
    homeName,
  });

  if (!process.env.RESEND_API_KEY) {
    console.error('[Transfer Email] ERROR: RESEND_API_KEY is not set!');
    return;
  }

  if (contractors.length === 0) {
    console.log('[Transfer Email] No contractors to notify');
    return;
  }

  const results = await Promise.allSettled(
    contractors.map(async (contractor) => {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home Ownership Change</title>
</head>
<body style="${emailStyles.container}">
  <div style="${emailStyles.card}">
    <h1 style="${emailStyles.heading}">🏠 Home Ownership Update</h1>
    <p style="${emailStyles.subheading}">A home you're connected to has a new owner</p>
    
    <p style="${emailStyles.text}">
      Hi ${contractor.businessName},
    </p>
    
    <p style="${emailStyles.text}">
      The ownership of a home you're connected to on Dwella has changed.
      <strong>${newOwnerName}</strong> is now the owner of:
    </p>
    
    <div style="${emailStyles.homeCard}">
      <p style="${emailStyles.homeName}">${homeName}</p>
      <p style="${emailStyles.homeAddress}">${homeAddress}</p>
    </div>
    
    <p style="${emailStyles.text}">
      Your connection to this home remains active. The new owner can see your work history
      and may reach out about future projects.
    </p>
    
    <div style="margin: 24px 0;">
      <a href="${APP_URL}/pro/dashboard" style="${emailStyles.button}">View Dashboard</a>
    </div>
    
    <hr style="${emailStyles.divider}">
    
    <p style="${emailStyles.footer}">
      This is an automated message from Dwella.
    </p>
  </div>
</body>
</html>
      `;

      return resend.emails.send({
        from: getFromAddress(),
        to: contractor.email,
        subject: `Home ownership update - ${homeName}`,
        html,
      });
    })
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log('[Transfer Email] Contractor notifications complete:', {
    successful,
    failed,
    total: contractors.length,
  });

  if (failed > 0) {
    console.error('[Transfer Email] Some contractor notifications failed:',
      results.filter(r => r.status === 'rejected').map(r => (r as PromiseRejectedResult).reason)
    );
  }

  return results;
}