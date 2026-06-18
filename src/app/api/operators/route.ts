import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq, and, like, or, sql, asc, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const user_id = searchParams.get('user_id');
  const email = searchParams.get('email');
  const category = searchParams.get('category');
  const q = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius');
  const sort = searchParams.get('sort') || 'relevance';
  const price_min = searchParams.get('price_min');
  const price_max = searchParams.get('price_max');
  const ghat = searchParams.get('ghat');
  const area = searchParams.get('area');
  const language = searchParams.get('language');
  const verified_only = searchParams.get('verified') === 'true';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    let query = db
      .select({
        id: operators.id,
        created_at: operators.created_at,
        updated_at: operators.updated_at,
        user_id: operators.user_id,
        slug: operators.slug,
        name: operators.name,
        category: operators.category,
        short_desc: operators.short_desc,
        long_desc: operators.long_desc,
        whatsapp: operators.whatsapp,
        email: operators.email,
        pricing_note: operators.pricing_note,
        status: operators.status,
        hidden: operators.hidden,
        verified: operators.verified,
        plan: operators.plan,
        lead_month: operators.lead_month,
        photos: operators.photos,
        tariffs: operators.tariffs,
        houseboat_details: operators.houseboat_details,
        shikara_details: operators.shikara_details,
        artisan_details: operators.artisan_details,
        taxi_details: operators.taxi_details,
        accommodation_details: operators.accommodation_details,
        guide_details: operators.guide_details,
        vendor_details: operators.vendor_details,
        lat: operators.lat,
        lng: operators.lng,
      })
      .from(operators)
      .$dynamic();

    const session = await auth();
    const sUser = session?.user as unknown as Record<string, unknown> | undefined;
    const isAuthenticated = !!session;

    const conditions = [];

    if (id) {
      if (!isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      conditions.push(eq(operators.id, id));
    } else if (user_id) {
      if (!isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      conditions.push(eq(operators.user_id, user_id));
    } else if (email) {
      if (!isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      conditions.push(eq(operators.email, email));
    } else {
      conditions.push(eq(operators.status, 'approved'), eq(operators.hidden, false));
    }

    if (category) {
      conditions.push(eq(operators.category, category as any));
    }

    if (q) {
      const searchTerm = `%${q}%`;
      conditions.push(
        or(
          like(operators.name, searchTerm),
          like(operators.short_desc, searchTerm),
          like(operators.long_desc, searchTerm),
        )
      );
    }

    if (price_min || price_max) {
      const pMin = price_min ? parseFloat(price_min) : 0;
      const pMax = price_max ? parseFloat(price_max) : 999999;
      if (!isNaN(pMin) && !isNaN(pMax)) {
        conditions.push(
          or(
            and(
              eq(operators.category, 'houseboat'),
              sql`COALESCE(NULLIF(${operators.tariffs}->>'double_ep', '')::numeric, 0) BETWEEN ${pMin} AND ${pMax}`,
            ),
            and(
              eq(operators.category, 'taxi'),
              sql`COALESCE(NULLIF(${operators.taxi_details}->>'price_per_km', '')::numeric, 0) BETWEEN ${pMin} AND ${pMax}`,
            ),
          )
        );
      }
    }

    // Ghat filter (houseboat + shikara)
    if (ghat) {
      const ghats = ghat.split(',').map(g => g.trim());
      conditions.push(
        or(
          sql`${operators.houseboat_details}->>'boat_ghat' = ANY(${ghats}::text[])`,
          sql`${operators.shikara_details}->>'ghat_number' = ANY(${ghats}::text[])`,
        )
      );
    }

    if (area) {
      const areas = area.split(',').map(a => a.trim());
      conditions.push(
        or(
          sql`${operators.shikara_details}->'operating_areas' ?| ${areas}::text[]`,
          sql`${operators.taxi_details}->'operating_areas' ?| ${areas}::text[]`,
          sql`${operators.guide_details}->'operating_areas' ?| ${areas}::text[]`,
          sql`${operators.vendor_details}->'operating_areas' ?| ${areas}::text[]`,
          sql`${operators.accommodation_details}->'operating_areas' ?| ${areas}::text[]`,
        )
      );
    }

    if (language) {
      const langs = language.split(',').map(l => l.trim());
      conditions.push(
        or(
          sql`${operators.shikara_details}->'languages' ?| ${langs}::text[]`,
          sql`${operators.taxi_details}->'languages' ?| ${langs}::text[]`,
          sql`${operators.guide_details}->'languages' ?| ${langs}::text[]`,
          sql`${operators.accommodation_details}->'languages' ?| ${langs}::text[]`,
        )
      );
    }

    // Verified only
    if (verified_only) {
      conditions.push(eq(operators.verified, true));
    }

    if (lat && lng && radius) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusMeters = parseFloat(radius) * 1000;
      if (!isNaN(latNum) && !isNaN(lngNum) && !isNaN(radiusMeters)) {
        conditions.push(
          sql`earth_box(ll_to_earth(${latNum}, ${lngNum}), ${radiusMeters}) @> ll_to_earth(${operators.lat}, ${operators.lng})`
        );
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sort
    let orderBy: any;
    switch (sort) {
      case 'newest':
        orderBy = desc(operators.created_at);
        break;
      case 'name':
        orderBy = asc(operators.name);
        break;
      case '-name':
        orderBy = desc(operators.name);
        break;
      default:
        orderBy = [desc(operators.verified), asc(operators.name)];
    }

    const result = await query
      .orderBy(...(Array.isArray(orderBy) ? orderBy : [orderBy]))
      .limit(limit + 1)
      .offset(offset);

    const hasMore = result.length > limit;
    if (hasMore) result.pop();

    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        result.sort((a, b) => {
          if (!a.lat || !a.lng || !b.lat || !b.lng) return 0;
          const da = distance(latNum, lngNum, a.lat, a.lng);
          const db = distance(latNum, lngNum, b.lat, b.lng);
          return da - db;
        });
      }
    }

    return NextResponse.json({ data: result, hasMore });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch operators' }, { status: 500 });
  }
}

function distance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const { allowed } = rateLimit(`create-op:${ip}`, 3, 3600000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { name, category, short_desc, long_desc, whatsapp, email, pricing_note, photos, tariffs, houseboat_details, shikara_details, artisan_details, taxi_details, accommodation_details, guide_details, vendor_details, lat, lng } = body;

    if (!name || !category || !whatsapp) {
      return NextResponse.json({ error: 'Name, category, and WhatsApp are required' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);

    const result = await db
      .insert(operators)
      .values({
        name,
        category,
        short_desc: short_desc || null,
        long_desc: long_desc || null,
        whatsapp,
        email: email || null,
        pricing_note: pricing_note || null,
        photos: photos || [],
        tariffs: tariffs || null,
        houseboat_details: houseboat_details || null,
        shikara_details: shikara_details || null,
        artisan_details: artisan_details || null,
        taxi_details: taxi_details || null,
        accommodation_details: accommodation_details || null,
        guide_details: guide_details || null,
        vendor_details: vendor_details || null,
        lat: lat != null ? lat : null,
        lng: lng != null ? lng : null,
        slug,
        status: 'pending',
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating operator:', error);
    return NextResponse.json({ error: 'Failed to create operator' }, { status: 500 });
  }
}
