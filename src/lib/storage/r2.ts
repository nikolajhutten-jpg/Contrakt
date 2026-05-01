import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/env";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const r2Client: S3Client = (globalThis as any).__r2Client ??= new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a buffer to R2.
 * Key path: {tenantId}/{folder}/{fileName}
 * Returns the stored key (used as filePath in Document records).
 */
export async function uploadFile(
  tenantId: string,
  folder: string,
  fileName: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  console.log("[R2] R2_ENDPOINT:", env.R2_ENDPOINT);
  console.log("[R2] R2_BUCKET_NAME:", env.R2_BUCKET_NAME);
  const key = `${tenantId}/${folder}/${fileName}`;
  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
  } catch (err) {
    console.log("[R2] upload error:", err instanceof Error ? err.message : JSON.stringify(err));
    throw err;
  }
  return key;
}

/**
 * Returns a presigned URL for reading a stored file.
 * Expires after expiresInSeconds seconds.
 */
export async function getSignedUrl(
  filePath: string,
  expiresInSeconds: number,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: filePath,
  });
  return awsGetSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
}
