import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Base URL for building links
const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_BASE_URL ||
  "http://localhost:3000";

// Clean and validate the FROM address
const getFromAddress = () => {
  const raw = process.env.EMAIL_FROM || "hello@mydwellaapp.com";
  const cleaned = raw.replace(/^["']|["']$/g, '').trim();

  if (cleaned && !cleaned.includes('<')) {
    return `Dwella <${cleaned}>`;
  }

  return cleaned || "MyDwella Team <hello@mydwellaapp.com>";
};

// Password reset email
export async function sendPasswordResetEmail({
  to,
  token,
}: {
  to: string;
  token: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "RESEND_API_KEY is not set – password reset email will not be sent."
    );
    return { success: false, error: "No API key" };
  }

  const resetUrl = `${APP_BASE_URL}/reset-password?token=${encodeURIComponent(
    token
  )}`;

  const subject = "Reset your MyDwella password";

  const text = [
    "You requested to reset your MyDwella password.",
    "",
    "Click the link below to choose a new password:",
    resetUrl,
    "",
    "This link expires in 1 hour.",
    "",
    "If you didn't request this, you can safely ignore this email.",
  ].join("\n");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #1a1a1a;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: rgba(40, 40, 40, 0.95); border-radius: 24px; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.6);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px 40px; text-align: center;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 600; color: #ffffff; letter-spacing: -0.02em;">
                      Reset Your Password
                    </h1>
                    <p style="margin: 12px 0 0 0; font-size: 15px; color: rgba(255, 255, 255, 0.75); line-height: 1.5;">
                      You requested to reset your password for your Dwella account.
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0 30px 0;">
                          <a href="${resetUrl}" 
                             style="display: inline-block; 
                                    background: linear-gradient(135deg, rgba(243, 90, 31, 0.9) 0%, rgba(224, 74, 15, 0.9) 100%); 
                                    color: #ffffff; 
                                    padding: 16px 48px; 
                                    text-decoration: none; 
                                    border-radius: 12px; 
                                    font-weight: 600; 
                                    font-size: 16px;
                                    border: 1px solid rgba(255, 255, 255, 0.3);
                                    box-shadow: 0 10px 28px rgba(243, 90, 31, 0.35);">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 20px 0; border-top: 1px solid rgba(255, 255, 255, 0.1);"></td>
                      </tr>
                    </table>

                    <!-- Link -->
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: rgba(255, 255, 255, 0.6); text-align: center;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0; font-size: 12px; color: rgba(243, 90, 31, 0.9); text-align: center; word-break: break-all; background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);">
                      ${resetUrl}
                    </p>

                    <!-- Info -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                      <tr>
                        <td style="padding: 20px 0; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                          <p style="margin: 0 0 10px 0; font-size: 13px; color: rgba(255, 255, 255, 0.6); text-align: center;">
                            ⏱️ This link expires in <strong style="color: rgba(255, 255, 255, 0.9);">1 hour</strong>
                          </p>
                          <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.6); text-align: center;">
                            🔒 If you didn't request this, you can safely ignore this email
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: rgba(255, 255, 255, 0.5);">
                      The MyDwella Team
                    </p>
                    <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.4);">
                      Your home's journal. Organized. Verified.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
      text,
    });

    console.log("Password reset email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, error };
  }
}

// Invitation email
interface InvitationEmailParams {
  to: string;
  inviterName: string;
  inviterCompany?: string;
  inviteeName?: string;
  message?: string;
  token: string;
  role: string;
}

export async function sendInvitationEmail({
  to,
  inviterName,
  inviterCompany,
  inviteeName,
  message,
  token,
  role,
}: InvitationEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "RESEND_API_KEY is not set – invitation email will not be sent."
    );
    return { success: false, error: "No API key" };
  }

  const inviteUrl = `${APP_BASE_URL}/register?token=${token}`;
  const companyName = inviterCompany || inviterName;
  const greeting = inviteeName ? `Hi ${inviteeName}` : "Hello";

  const subject =
    role === "HOMEOWNER"
      ? `${companyName} invited you to Dwella`
      : `${inviterName} invited you to join Dwella`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #1a1a1a;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: rgba(40, 40, 40, 0.95); border-radius: 24px; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.6);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px 40px; text-align: center;">
                    <h1 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 600; color: #ffffff; letter-spacing: -0.02em;">
                      ${greeting}!
                    </h1>
                    <p style="margin: 0; font-size: 16px; color: rgba(255, 255, 255, 0.75); line-height: 1.5;">
                      <strong style="color: #ffffff;">${companyName}</strong> has invited you to join Dwella${
    role === "HOMEOWNER"
      ? " to manage your stats maintenance"
      : " as a contractor"
  }.
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    
                    ${
                      message
                        ? `
                    <!-- Personal Message -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      <tr>
                        <td style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-left: 4px solid rgba(243, 90, 31, 0.9); border-radius: 8px;">
                          <p style="margin: 0; font-style: italic; color: rgba(255, 255, 255, 0.8); font-size: 15px; line-height: 1.6;">
                            "${message}"
                          </p>
                        </td>
                      </tr>
                    </table>
                    `
                        : ""
                    }

                    <!-- Features -->
                    <p style="margin: 0 0 16px 0; font-size: 15px; color: rgba(255, 255, 255, 0.75); font-weight: 600;">
                      Dwella helps you:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      ${
                        role === "HOMEOWNER"
                          ? `
                      <tr><td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6;">• Keep all contractor communications in one place</td></tr>
                      <tr><td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6;">• Track your home maintenance history</td></tr>
                      <tr><td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6;">• Receive and approve quotes easily</td></tr>
                      <tr><td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6;">• Never lose important home documents</td></tr>
                      `
                          : `
                      <tr><td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6;">• Manage all your clients in one place</td></tr>
                      <tr><td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6;">• Send professional quotes instantly</td></tr>
                      <tr><td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6;">• Build your work history and reviews</td></tr>
                      <tr><td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6;">• Stay organized and look professional</td></tr>
                      `
                      }
                    </table>

                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 10px 0 30px 0;">
                          <a href="${inviteUrl}" 
                             style="display: inline-block; 
                                    background: linear-gradient(135deg, rgba(243, 90, 31, 0.9) 0%, rgba(224, 74, 15, 0.9) 100%); 
                                    color: #ffffff; 
                                    padding: 16px 48px; 
                                    text-decoration: none; 
                                    border-radius: 12px; 
                                    font-weight: 600; 
                                    font-size: 16px;
                                    border: 1px solid rgba(255, 255, 255, 0.3);
                                    box-shadow: 0 10px 28px rgba(243, 90, 31, 0.35);">
                            Accept Invitation
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Info -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 20px 0; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                          <p style="margin: 0 0 10px 0; font-size: 13px; color: rgba(255, 255, 255, 0.6); text-align: center;">
                            This invitation expires in 7 days
                          </p>
                          <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.6); text-align: center;">
                            If you didn't expect this invitation, you can safely ignore this email
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: rgba(255, 255, 255, 0.5);">
                      The Dwella Team
                    </p>
                    <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.4);">
                      Your home's journal. Organized. Verified.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
    });

    console.log("Invitation email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return { success: false, error };
  }
}

// Disconnect notification email (sent to contractor when homeowner disconnects)
interface DisconnectNotificationParams {
  to: string;
  contractorName: string;
  homeownerName: string;
  homeAddress: string;
}

export async function sendDisconnectNotificationEmail({
  to,
  contractorName,
  homeownerName,
  homeAddress,
}: DisconnectNotificationParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "RESEND_API_KEY is not set – disconnect notification email will not be sent."
    );
    return { success: false, error: "No API key" };
  }

  const dashboardUrl = `${APP_BASE_URL}/contractor`;
  const greeting = contractorName || "there";

  const subject = `Connection ended for ${homeAddress}`;

  const text = [
    `Hi ${greeting},`,
    "",
    `${homeownerName} has ended their connection with you for the property at:`,
    homeAddress,
    "",
    "This means:",
    "• You can no longer submit work for this property",
    "• Any pending job requests have been cancelled",
    "• Your verified work history remains on record",
    "",
    "Your message history with this homeowner is still available in your account.",
    "",
    "If you have questions, you can review your past communications in your dashboard.",
  ].join("\n");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #1a1a1a;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: rgba(40, 40, 40, 0.95); border-radius: 24px; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.6);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px 40px; text-align: center;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 600; color: #ffffff; letter-spacing: -0.02em;">
                      Connection Ended
                    </h1>
                    <p style="margin: 12px 0 0 0; font-size: 15px; color: rgba(255, 255, 255, 0.75); line-height: 1.5;">
                      Hi ${greeting}, a homeowner has ended their connection with you.
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    
                    <!-- Property Info -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      <tr>
                        <td style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
                          <p style="margin: 0 0 8px 0; font-size: 13px; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 0.5px;">
                            Property
                          </p>
                          <p style="margin: 0; font-size: 18px; font-weight: 600; color: #ffffff;">
                            ${homeAddress}
                          </p>
                          <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.6);">
                            Disconnected by ${homeownerName}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- What This Means -->
                    <p style="margin: 0 0 16px 0; font-size: 15px; color: rgba(255, 255, 255, 0.75); font-weight: 600;">
                      What this means:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6;">
                          • You can no longer submit work for this property
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6;">
                          • Any pending job requests have been cancelled
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6;">
                          • Your verified work history remains on record
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6;">
                          • Your message history is still available
                        </td>
                      </tr>
                    </table>

                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 10px 0 30px 0;">
                          <a href="${dashboardUrl}" 
                             style="display: inline-block; 
                                    background: rgba(255, 255, 255, 0.1); 
                                    color: #ffffff; 
                                    padding: 14px 36px; 
                                    text-decoration: none; 
                                    border-radius: 12px; 
                                    font-weight: 600; 
                                    font-size: 15px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);">
                            View Your Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Info -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 20px 0; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                          <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.6); text-align: center;">
                            If you have questions about this change, you can review your past communications in your account.
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: rgba(255, 255, 255, 0.5);">
                      The Dwella Team
                    </p>
                    <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.4);">
                      Your home's journal. Organized. Verified.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
      text,
    });

    console.log("Disconnect notification email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error sending disconnect notification email:", error);
    return { success: false, error };
  }
}

// Reconnect notification email (sent to contractor when homeowner restores connection)
interface ReconnectNotificationParams {
  to: string;
  contractorName: string;
  homeownerName: string;
  homeAddress: string;
}

export async function sendReconnectNotificationEmail({
  to,
  contractorName,
  homeownerName,
  homeAddress,
}: ReconnectNotificationParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "RESEND_API_KEY is not set – reconnect notification email will not be sent."
    );
    return { success: false, error: "No API key" };
  }

  const dashboardUrl = `${APP_BASE_URL}/contractor`;
  const greeting = contractorName || "there";

  const subject = `Connection restored for ${homeAddress}`;

  const text = [
    `Hi ${greeting},`,
    "",
    `Great news! ${homeownerName} has restored their connection with you for the property at:`,
    homeAddress,
    "",
    "This means:",
    "• You can now submit work for this property again",
    "• You can send and receive messages",
    "• You can send quotes and job proposals",
    "",
    "Log in to your dashboard to get started.",
  ].join("\n");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #1a1a1a;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: rgba(40, 40, 40, 0.95); border-radius: 24px; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.6);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px 40px; text-align: center;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 600; color: #ffffff; letter-spacing: -0.02em;">
                      🎉 Connection Restored
                    </h1>
                    <p style="margin: 12px 0 0 0; font-size: 15px; color: rgba(255, 255, 255, 0.75); line-height: 1.5;">
                      Hi ${greeting}, great news! A homeowner has reconnected with you.
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    
                    <!-- Property Info -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      <tr>
                        <td style="background: rgba(34, 197, 94, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.3);">
                          <p style="margin: 0 0 8px 0; font-size: 13px; color: rgba(34, 197, 94, 0.9); text-transform: uppercase; letter-spacing: 0.5px;">
                            Property Reconnected
                          </p>
                          <p style="margin: 0; font-size: 18px; font-weight: 600; color: #ffffff;">
                            ${homeAddress}
                          </p>
                          <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.6);">
                            Restored by ${homeownerName}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- What This Means -->
                    <p style="margin: 0 0 16px 0; font-size: 15px; color: rgba(255, 255, 255, 0.75); font-weight: 600;">
                      You can now:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6;">
                          ✓ Submit work for this property
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6;">
                          ✓ Send and receive messages
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6;">
                          ✓ Send quotes and job proposals
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6;">
                          ✓ Access your full message history
                        </td>
                      </tr>
                    </table>

                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 10px 0 30px 0;">
                          <a href="${dashboardUrl}" 
                             style="display: inline-block; 
                                    background: linear-gradient(135deg, rgba(243, 90, 31, 0.9) 0%, rgba(224, 74, 15, 0.9) 100%); 
                                    color: #ffffff; 
                                    padding: 16px 48px; 
                                    text-decoration: none; 
                                    border-radius: 12px; 
                                    font-weight: 600; 
                                    font-size: 16px;
                                    border: 1px solid rgba(255, 255, 255, 0.3);
                                    box-shadow: 0 10px 28px rgba(243, 90, 31, 0.35);">
                            Go to Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: rgba(255, 255, 255, 0.5);">
                      The Dwella Team
                    </p>
                    <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.4);">
                      Your home's journal. Organized. Verified.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
      text,
    });

    console.log("Reconnect notification email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error sending reconnect notification email:", error);
    return { success: false, error };
  }
}