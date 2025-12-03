// lib/postcard.ts
import type { Home } from "@prisma/client";

type PostalAddress = {
  name: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
};

export type PostcardResult = {
  providerId: string;
  rawResponse: unknown;
};

const LOB_API_KEY = process.env.LOB_API_KEY;
const LOB_FROM_ADDRESS_ID = process.env.LOB_FROM_ADDRESS_ID;

function requireLobConfig() {
  if (!LOB_API_KEY || !LOB_FROM_ADDRESS_ID) {
    throw new Error("Lob configuration missing (LOB_API_KEY, LOB_FROM_ADDRESS_ID).");
  }
}

/**
 * Sends a verification postcard via Lob with a simple HTML template.
 */
export async function sendVerificationPostcardViaLob(options: {
  to: PostalAddress;
  home: Pick<Home, "id" | "address">;
  code: string;
}): Promise<PostcardResult> {
  requireLobConfig();

  const { to, home, code } = options;
  const country = to.country ?? "US";

  const authHeader = Buffer.from(`${LOB_API_KEY}:`).toString("base64");

  const frontHtml = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
          .wrapper { padding: 24px; }
          .title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
          .subtitle { font-size: 16px; margin-bottom: 16px; }
          .code-box {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 4px;
            border: 2px dashed #000;
            padding: 16px;
            display: inline-block;
            margin-top: 12px;
          }
          .logo { font-size: 14px; font-weight: 600; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="title">Verify your home on MyDwella</div>
          <div class="subtitle">For property: ${home.address}</div>
          <p>Someone added this address to their MyDwella account.</p>
          <p>To confirm you are the homeowner, enter this code in the app:</p>
          <div class="code-box">${code}</div>
          <p class="logo">MyDwella • mydwella.com</p>
        </div>
      </body>
    </html>
  `;

  const backHtml = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
          .wrapper { padding: 24px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <p>Hello from MyDwella!</p>
          <p>
            MyDwella helps homeowners keep a verified record of work done on their home
            and stay connected with trusted contractors.
          </p>
          <p>
            If you did not attempt to verify this address, you can ignore this postcard.
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.lob.com/v1/postcards", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: `MyDwella verification for home ${home.id}`,
        to: {
          name: to.name,
          address_line1: to.addressLine1,
          address_line2: to.addressLine2 || undefined,
          address_city: to.city,
          address_state: to.state,
          address_zip: to.postalCode,
          address_country: country,
        },
        from: LOB_FROM_ADDRESS_ID,
        front: frontHtml,
        back: backHtml,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Lob API error: ${response.status} ${text}`);
    }

    const json = await response.json();
    return {
      providerId: json.id ?? "unknown",
      rawResponse: json,
    };
  } catch (err) {
    console.error("Error sending Lob postcard:", err);
    throw new Error("POSTCARD_SEND_FAILED");
  }
}