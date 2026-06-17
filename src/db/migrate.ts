import { neon } from '@neondatabase/serverless';

const run = async () => {
  const sql = neon(process.env.DATABASE_URL!);

  await sql`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`;
  await sql`CREATE EXTENSION IF NOT EXISTS "cube"`;
  await sql`CREATE EXTENSION IF NOT EXISTS "earthdistance"`;

  await sql`
    CREATE TABLE IF NOT EXISTS operators (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      user_id UUID,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('houseboat','shikara','artisan','guide','vendor','taxi')),
      short_desc TEXT CHECK (char_length(short_desc) <= 500),
      long_desc TEXT CHECK (char_length(long_desc) <= 2000),
      whatsapp TEXT NOT NULL,
      email TEXT,
      pricing_note TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
      verified BOOLEAN DEFAULT false,
      plan TEXT DEFAULT 'free' CHECK (plan IN ('free','pro')),
      lead_month INTEGER DEFAULT 0,
      photos TEXT[],
      tariffs JSONB,
      houseboat_details JSONB
    )
  `;
  // Update CHECK constraint for existing tables
  await sql`
    ALTER TABLE operators DROP CONSTRAINT IF EXISTS operators_category_check
  `;
  await sql`
    ALTER TABLE operators ADD CONSTRAINT operators_category_check CHECK (category IN ('houseboat','shikara','artisan','guide','vendor','taxi'))
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ DEFAULT now(),
      operator_id UUID REFERENCES operators(id) ON DELETE CASCADE,
      session_id TEXT NOT NULL,
      source TEXT DEFAULT 'profile'
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS favorites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      operator_id UUID REFERENCES operators(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(user_id, operator_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      slug TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      label_hi TEXT,
      icon TEXT,
      active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS operators_search_idx
    ON operators USING GIN (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(short_desc,'') || ' ' || coalesce(long_desc,'')))
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS operators_category_status_idx
    ON operators (category, status)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS phone_verifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone TEXT NOT NULL,
      otp TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      attempts INTEGER DEFAULT 0,
      verified BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      otp TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      attempts INTEGER DEFAULT 0,
      verified BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  await sql`
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS visitor_name TEXT
  `;
  await sql`
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS visitor_phone TEXT
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS leads_operator_created_idx
    ON leads (operator_id, created_at DESC)
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS operators_slug_idx
    ON operators (slug)
  `;

  // Seed categories if empty
  const existing = await sql`SELECT COUNT(*) as cnt FROM categories`;
  if (existing[0].cnt === 0) {
    await sql`
      INSERT INTO categories (slug, label, icon, sort_order) VALUES
        ('houseboat', 'Houseboats', 'IconHome', 1),
        ('shikara', 'Shikara Rides', 'IconSailboat', 2),
        ('artisan', 'Artisans & Crafts', 'IconPalette', 3),
        ('guide', 'Local Guides', 'IconMapPin', 4),
        ('vendor', 'Floating Vendors', 'IconShoppingBag', 5),
        ('taxi', 'Taxis & Transfers', 'IconCar', 6)
    `;
  }

  // Add JSONB columns to existing operators table if missing
  await sql`
    ALTER TABLE operators ADD COLUMN IF NOT EXISTS tariffs JSONB
  `;
  await sql`
    ALTER TABLE operators ADD COLUMN IF NOT EXISTS houseboat_details JSONB
  `;
  await sql`
    ALTER TABLE operators ADD COLUMN IF NOT EXISTS shikara_details JSONB
  `;
  await sql`
    ALTER TABLE operators ADD COLUMN IF NOT EXISTS artisan_details JSONB
  `;
  await sql`
    ALTER TABLE operators ADD COLUMN IF NOT EXISTS taxi_details JSONB
  `;
  await sql`
    ALTER TABLE operators ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION
  `;
  await sql`
    ALTER TABLE operators ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS operators_earth_idx
    ON operators USING gist (ll_to_earth(lat, lng))
  `;

  await sql`
    ALTER TABLE operators ADD COLUMN IF NOT EXISTS email TEXT
  `;

  // Backfill email for existing operators where email is null
  await sql`
    UPDATE operators SET email = lower(regexp_replace(whatsapp, '\D', '', 'g')) || '@kashmir360.com'
    WHERE email IS NULL AND whatsapp IS NOT NULL
  `;

  // Backfill email from houseboat_details / artisan_details JSON columns
  // These take priority over the synthetic @kashmir360.com fallback
  await sql`
    UPDATE operators
    SET email = LOWER(TRIM(houseboat_details->>'email'))
    WHERE (email IS NULL OR email LIKE '%@kashmir360.com')
      AND houseboat_details IS NOT NULL
      AND houseboat_details->>'email' IS NOT NULL
      AND houseboat_details->>'email' != ''
  `;
  await sql`
    UPDATE operators
    SET email = LOWER(TRIM(artisan_details->>'email'))
    WHERE (email IS NULL OR email LIKE '%@kashmir360.com')
      AND artisan_details IS NOT NULL
      AND artisan_details->>'email' IS NOT NULL
      AND artisan_details->>'email' != ''
  `;

  await sql`
    ALTER TABLE operators ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false
  `;

  console.log('Migration completed successfully');
  process.exit(0);
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
