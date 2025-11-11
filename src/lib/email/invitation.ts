import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?token=${token}`;

  const companyName = inviterCompany || inviterName;
  const greeting = inviteeName ? `Hi ${inviteeName}` : "Hello";

  const subject =
    role === "HOMEOWNER"
      ? `${companyName} invited you to MyHomeDox`
      : `${inviterName} invited you to join MyHomeDox`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">MyHomeDox</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Home, Organized</p>
        </div>

        <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
          
          <p style="font-size: 18px; margin-top: 0;">${greeting},</p>
          
          <p style="font-size: 16px; margin: 20px 0;">
            <strong>${companyName}</strong> has invited you to join MyHomeDox${
    role === "HOMEOWNER"
      ? " to manage your home maintenance and stay connected"
      : " as a contractor"
  }.
          </p>

          ${
            message
              ? `
          <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; font-style: italic; color: #555;">
              "${message}"
            </p>
          </div>
          `
              : ""
          }

          <p style="font-size: 16px; margin: 25px 0;">
            MyHomeDox helps you:
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
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
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
          <p>MyHomeDox - Home Maintenance Made Simple</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #667eea; text-decoration: none;">Visit our website</a>
          </p>
        </div>

      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "MyHomeDox <noreply@myhomedox.com>",
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Error sending invitation email:", error);
    throw error;
  }
}