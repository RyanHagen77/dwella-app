// lib/twilio.ts
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client: ReturnType<typeof twilio> | null = null;

if (accountSid && authToken && twilioPhoneNumber) {
  client = twilio(accountSid, authToken);
}

export async function sendInvitationSMS(
  to: string,
  homeAddress: string,
  contractorName: string,
  invitationUrl: string
): Promise<{ success: boolean; error?: string }> {
  if (!client || !twilioPhoneNumber) {
    return { success: false, error: "SMS not configured" };
  }

  const digits = to.replace(/\D/g, "");
  const formattedPhone = to.startsWith("+") ? to : `+1${digits}`;

  if (formattedPhone.replace(/\D/g, "").length !== 11) {
    return { success: false, error: "Invalid phone number format" };
  }

  // Ultra-short message for Twilio trial
  const message = `${contractorName} logged work at your home. View: ${invitationUrl}`;

  try {
    await client.messages.create({
      body: message,
      to: formattedPhone,
      from: twilioPhoneNumber,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Twilio SMS error:", {
      msg: error?.message,
      code: error?.code,
      moreInfo: error?.moreInfo,
    });

    return {
      success: false,
      error: error?.message || "Failed to send SMS",
    };
  }
}