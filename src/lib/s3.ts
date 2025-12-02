// src/lib/s3.ts
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/* --- Safe env helpers --- */
function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/* --- Environment detection with fallbacks --- */
export const AWS_REGION =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  "us-east-1";

export const S3_BUCKET =
  process.env.S3_BUCKET ||
  process.env.AWS_S3_BUCKET ||
  must("S3_BUCKET"); // fail loudly if both missing

export const AWS_ACCESS_KEY_ID = must("AWS_ACCESS_KEY_ID");
export const AWS_SECRET_ACCESS_KEY = must("AWS_SECRET_ACCESS_KEY");

/* --- Public URL prefix (for GETs) --- */
// Reject invalid console URLs, or auto-derive a correct one
const derivedPrefix = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;
export const PUBLIC_S3_URL_PREFIX =
  process.env.PUBLIC_S3_URL_PREFIX &&
  !/console\.aws\.amazon\.com/i.test(process.env.PUBLIC_S3_URL_PREFIX)
    ? process.env.PUBLIC_S3_URL_PREFIX
    : derivedPrefix;

/* --- S3 client --- */
export const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

/* --- Build keys for any entity type --- */
export function buildKey(
  homeId: string,
  entityType: "records" | "reminders" | "warranties" | "service-requests",
  entityId: string,
  filename: string
) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `homes/${homeId}/${entityType}/${entityId}/${Date.now()}_${safeName}`;
}

/* --- Build keys for records (backwards compatibility) --- */
export function buildRecordKey(
  homeId: string,
  recordId: string,
  filename: string
) {
  return buildKey(homeId, "records", recordId, filename);
}

/* --- Build keys for reminders --- */
export function buildReminderKey(
  homeId: string,
  reminderId: string,
  filename: string
) {
  return buildKey(homeId, "reminders", reminderId, filename);
}

/* --- Build keys for warranties --- */
export function buildWarrantyKey(
  homeId: string,
  warrantyId: string,
  filename: string
) {
  return buildKey(homeId, "warranties", warrantyId, filename);
}

/* --- Build keys for job requests --- */
export function buildServiceRequestKey(
  homeId: string,
  serviceRequestId: string,
  filename: string
) {
  return buildKey(homeId, "service-requests", serviceRequestId, filename);
}

/* --- Sign GET URLs --- */
export async function getSignedGetUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn: 3600 });
}

export function extractS3Key(url: string): string {
  const match = url.match(/amazonaws\.com\/(.+)$/);
  return match ? match[1] : url;
}