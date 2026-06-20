const REQUIRED = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

const OPTIONAL = [
  'RESEND_API_KEY',
  'PEXELS_API_KEY',
  'GNEWS_API_KEY',
  'TICKETMASTER_API_KEY',
  'ADMIN_EMAILS',
  'S3_ENDPOINT',
  'S3_BUCKET',
  'OPENWA_API_URL',
  'OPENWA_API_KEY',
  'OPENWA_SESSION',
  'WHATSAPP_WEBHOOK_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'PRO_MONTHLY_LEADS',
  'LIBRETRANSLATE_URL',
] as const;

const warned = new Set<string>();

export function validateEnv() {
  if (typeof window !== 'undefined') return;

  for (const key of REQUIRED) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  if (process.env.NODE_ENV === 'development') {
    for (const key of OPTIONAL) {
      if (!process.env[key] && !warned.has(key)) {
        warned.add(key);
        console.warn(`[env] Missing optional env var: ${key}`);
      }
    }
  }
}

validateEnv();
