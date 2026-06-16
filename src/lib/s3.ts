import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET || 'operator-photos';

export async function uploadPhoto(key: string, buffer: Buffer, contentType: string) {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await s3.send(cmd);
  return `https://${BUCKET}.${process.env.S3_ENDPOINT}/${key}`;
}

export async function deletePhoto(key: string) {
  const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await s3.send(cmd);
}

export function getPublicUrl(key: string) {
  const baseUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || `https://${BUCKET}.${process.env.S3_ENDPOINT}`;
  return `${baseUrl}/${key}`;
}
