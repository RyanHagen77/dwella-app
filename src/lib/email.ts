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

  // Remove any quotes that might be in the env var
  const cleaned = raw.replace(/^["']|["']$/g, '').trim();

  // If it's just an email, add display name
  if (cleaned && !cleaned.includes('<')) {
    return `Dwella <${cleaned}>`;
  }

  // If it already has format "Name <email>", return as-is
  return cleaned || "Dwella <hello@mydwellaapp.com>";
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

  const subject = "Reset your Dwella password";

  const text = [
    "You requested to reset your Dwella password.",
    "",
    "Click the link below to choose a new password:",
    resetUrl,
    "",
    "This link expires in 1 hour.",
    "",
    "If you didn't request this, you can safely ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #ffffff; background: linear-gradient(135deg, #33C17D 0%, #2BA36A 100%); padding: 20px; border-radius: 12px; margin: 0; font-size: 24px;">
          Dwella
        </h1>
      </div>
      
      <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0; font-size: 20px;">Reset Your Password</h2>
        <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
          You requested to reset your password for your Dwella account. Click the button below to choose a new password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(135deg, #F35A1F 0%, #E04A0F 100%); 
                    color: white; 
                    padding: 14px 32px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block;
                    font-weight: 600;
                    font-size: 15px;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #999; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
          Or copy and paste this link into your browser:
        </p>
        <p style="color: #F35A1F; font-size: 13px; word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 6px; margin: 0 0 20px 0;">
          ${resetUrl}
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 13px; margin: 0 0 8px 0;">
            ⏱️ This link expires in <strong>1 hour</strong>
          </p>
          <p style="color: #999; font-size: 13px; margin: 0;">
            🔒 If you didn't request this, you can safely ignore this email
          </p>
        </div>
      </div>
      
      <div style="text-align: center; color: #999; font-size: 12px;">
        <p style="margin: 0;">
          The Dwella Team<br>
          <a href="https://mydwellaapp.com" style="color: #33C17D; text-decoration: none;">mydwellaapp.com</a>
        </p>
      </div>
    </div>
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
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background: linear-gradient(135deg, #33C17D 0%, #2BA36A 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Dwella</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Home's Journal</p>
        </div>

        <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
          
          <p style="font-size: 18px; margin-top: 0;">${greeting},</p>
          
          <p style="font-size: 16px; margin: 20px 0;">
            <strong>${companyName}</strong> has invited you to join Dwella${
    role === "HOMEOWNER"
      ? " to manage your home maintenance and stay connected"
      : " as a contractor"
  }.
          </p>

          ${
            message
              ? `
          <div style="background: white; padding: 20px; border-left: 4px solid #33C17D; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; font-style: italic; color: #555;">
              "${message}"
            </p>
          </div>
          `
              : ""
          }

          <p style="font-size: 16px; margin: 25px 0;">
            Dwella helps you:
          </p>
          
          <ul style="font-size: 15px; line-height: 1.8; color: #555;">
            ${
              role === "HOMEOWNER"
                ? `
              <li>Keep all contractor communications in one place</li>
              <li>Track your home maintenance history</li>
              <li>Receive and approve quotes easily</li>
              <li>Never lose important home documents</li>
            `
                : `
              <li>Manage all your clients in one place</li>
              <li>Send professional quotes instantly</li>
              <li>Build your work history and reviews</li>
              <li>Stay organized and look professional</li>
            `
            }
          </ul>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${inviteUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #F35A1F 0%, #E04A0F 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(243, 90, 31, 0.3);">
              Accept Invitation
            </a>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            This invitation will expire in 7 days.
          </p>

          <p style="font-size: 13px; color: #999; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>

        </div>

        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>Dwella - Your Home's Journal</p>
          <p>
            <a href="${APP_BASE_URL}" style="color: #33C17D; text-decoration: none;">Visit our website</a>
          </p>
        </div>

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