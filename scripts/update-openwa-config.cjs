const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const ngrokUrl = process.argv[2];
const apiKey = process.argv[3];

if (!ngrokUrl || !apiKey) {
  console.error('Usage: node scripts/update-openwa-config.cjs <ngrok_url> <api_key>');
  process.exit(1);
}

// Normalize ngrok URL: ensure /api suffix
function normalizeUrl(url) {
  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/api')) url += '/api';
  return url;
}

// Read .env to get DATABASE_URL
function getDbUrl() {
  const envPath = path.resolve(__dirname, '..', '.env');
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      return trimmed.slice('DATABASE_URL='.length).replace(/^["']|["']$/g, '');
    }
  }
  return null;
}

async function main() {
  const dbUrl = getDbUrl();
  if (!dbUrl) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
  }

  const sql = neon(dbUrl);
  const finalUrl = normalizeUrl(ngrokUrl);

  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('openwa_api_url', ${finalUrl}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${finalUrl}, updated_at = NOW()
  `;
  console.log(`Saved openwa_api_url = ${finalUrl}`);

  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('openwa_api_key', ${apiKey}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${apiKey}, updated_at = NOW()
  `;
  console.log(`Saved openwa_api_key = ${apiKey.slice(0, 12)}...`);

  console.log('\nDone! Go to Connection tab and click Connect Now.');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
