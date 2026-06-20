import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq, and, like, or, sql, asc, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { sendText } from '@/lib/openwa';
import { getClientIp } from '@/lib/ip';
import { getGoogleMapsUrl } from '@/lib/parse-operator-coords';
import { parseGoogleMapsUrl } from '@/lib/location';

function effectiveCoords(op: { lat: number | null; lng: number | null } & Parameters<typeof getGoogleMapsUrl>[0]): { lat: number; lng: number } | null {
  if (op.lat && op.lng && op.lat !== 0 && op.lng !== 0) {
    return { lat: op.lat, lng: op.lng };
  }
  const gmaps = getGoogleMapsUrl(op);
  if (gmaps) {
    return parseGoogleMapsUrl(gmaps);
  }
  return null;
}

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
      if (category === 'accommodation') {
        conditions.push(sql`${operators.category} IN ('homestay', 'guest_house')`);
      } else {
        conditions.push(eq(operators.category, category as any));
      }
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
            and(
              eq(operators.category, 'shikara'),
              sql`COALESCE(NULLIF(${operators.shikara_details}->>'price_per_ride', '')::numeric, 0) BETWEEN ${pMin} AND ${pMax}`,
            ),
            and(
              eq(operators.category, 'homestay'),
              sql`COALESCE(NULLIF(${operators.accommodation_details}->>'pricing_double', '')::numeric, 0) BETWEEN ${pMin} AND ${pMax}`,
            ),
            and(
              eq(operators.category, 'guest_house'),
              sql`COALESCE(NULLIF(${operators.accommodation_details}->>'pricing_double', '')::numeric, 0) BETWEEN ${pMin} AND ${pMax}`,
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
          sql`${operators.houseboat_details}->>'boat_ghat' = ANY(ARRAY[${sql.join(ghats, sql`, `)}]::text[])`,
          sql`${operators.shikara_details}->>'ghat_number' = ANY(ARRAY[${sql.join(ghats, sql`, `)}]::text[])`,
        )
      );
    }

    if (area) {
      const areas = area.split(',').map(a => a.trim());
      conditions.push(
        or(
          sql`${operators.shikara_details}->'operating_areas' ?| ARRAY[${sql.join(areas, sql`, `)}]::text[]`,
          sql`${operators.taxi_details}->'operating_areas' ?| ARRAY[${sql.join(areas, sql`, `)}]::text[]`,
          sql`${operators.guide_details}->'operating_areas' ?| ARRAY[${sql.join(areas, sql`, `)}]::text[]`,
          sql`${operators.vendor_details}->'operating_areas' ?| ARRAY[${sql.join(areas, sql`, `)}]::text[]`,
        )
      );
    }

    if (language) {
      const langs = language.split(',').map(l => l.trim());
      conditions.push(
        or(
          sql`${operators.shikara_details}->'languages' ?| ARRAY[${sql.join(langs, sql`, `)}]::text[]`,
          sql`${operators.taxi_details}->'languages' ?| ARRAY[${sql.join(langs, sql`, `)}]::text[]`,
          sql`${operators.guide_details}->'languages' ?| ARRAY[${sql.join(langs, sql`, `)}]::text[]`,
          sql`${operators.accommodation_details}->'languages' ?| ARRAY[${sql.join(langs, sql`, `)}]::text[]`,
        )
      );
    }

    // Verified only
    if (verified_only) {
      conditions.push(eq(operators.verified, true));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const nearMe = lat && lng && radius;
    const latNum = nearMe ? parseFloat(lat) : null;
    const lngNum = nearMe ? parseFloat(lng) : null;

    // Near Me: fetch all matching operators (no pagination in SQL), parse coords from
    // google_maps URLs for operators without DB lat/lng, then filter + paginate in JS
    if (nearMe && latNum && lngNum) {
      const all = await db
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
        .where(and(...conditions));

      const radiusKm = parseFloat(radius);
      const withDist: (typeof operators.$inferSelect & { distance_km?: number })[] = [];
      for (const op of all) {
        const coords = effectiveCoords(op);
        if (!coords) continue;
        const d = distance(latNum, lngNum, coords.lat, coords.lng);
        if (d <= radiusKm) {
          (op as any).lat = coords.lat;
          (op as any).lng = coords.lng;
          (op as any).distance_km = Math.round(d * 10) / 10;
          withDist.push(op as any);
        }
      }
      withDist.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
      const paginated = withDist.slice(offset, offset + limit + 1);
      const hasMore = paginated.length > limit;
      if (hasMore) paginated.pop();
      return NextResponse.json({ data: paginated, hasMore });
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
      .offset(offset) as (typeof operators.$inferSelect & { distance_km?: number })[];

    const hasMore = result.length > limit;
    if (hasMore) result.pop();

    // Parse coordinates from google_maps URLs for operators without DB lat/lng
    for (const op of result) {
      if (!op.lat || !op.lng || op.lat === 0 || op.lng === 0) {
        const coords = effectiveCoords(op);
        if (coords) {
          (op as any).lat = coords.lat;
          (op as any).lng = coords.lng;
        }
      }
    }

    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        for (const op of result) {
          const coords = effectiveCoords(op);
          if (coords) {
            (op as any).lat = coords.lat;
            (op as any).lng = coords.lng;
            (op as any).distance_km = Math.round(distance(latNum, lngNum, coords.lat, coords.lng) * 10) / 10;
          }
        }
        result.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
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
  const ip = getClientIp(req);
  const { allowed } = await rateLimit(`create-op:${ip}`, 3, 3600000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { name, category, short_desc, long_desc, whatsapp, email, pricing_note, photos, tariffs, houseboat_details, shikara_details, artisan_details, taxi_details, accommodation_details, guide_details, vendor_details, lat, lng } = body;

    if (!name || !category || !whatsapp) {
      return NextResponse.json({ error: 'Name, category, and WhatsApp are required' }, { status: 400 });
    }

    // Check if operator with same WhatsApp already exists
    const existing = await db.query.operators.findFirst({
      where: eq(operators.whatsapp, whatsapp),
      columns: { id: true, name: true, slug: true, status: true },
    });
    if (existing) {
      return NextResponse.json({
        error: 'An operator with this WhatsApp number is already registered',
        existing: { id: existing.id, name: existing.name, slug: existing.slug, status: existing.status },
      }, { status: 409 });
    }

    let slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);

    // Ensure unique slug
    let slugSuffix = 0;
    let finalSlug = slug;
    while (true) {
      const slugExists = await db.query.operators.findFirst({
        where: eq(operators.slug, finalSlug),
        columns: { id: true },
      });
      if (!slugExists) break;
      slugSuffix++;
      finalSlug = `${slug}-${slugSuffix}`;
    }
    slug = finalSlug;

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

    const newOp = result[0];
    const adminPhone = process.env.KASHEER360_ADMIN_WHATSAPP;
    if (adminPhone) {
      sendText(
        adminPhone,
        `🆕 New Registration on Kasheer360\n\nName: ${newOp.name}\nCategory: ${newOp.category}\nWhatsApp: ${newOp.whatsapp}\nEmail: ${newOp.email || '—'}\nStatus: Pending approval\n\nView: https://kasheer360.com/admin/operators/${newOp.id}`,
      ).catch((err) => console.error('[operators] Failed to notify admin:', err));
    }

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating operator:', error);
    return NextResponse.json({ error: 'Failed to create operator' }, { status: 500 });
  }
}
