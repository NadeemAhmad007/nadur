import { NextResponse } from 'next/server';
import { db } from '@/db';
import { operators } from '@/db/schema';
import { eq, and, like, or, sql } from 'drizzle-orm';
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
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    let query = db
      .select()
      .from(operators)
      .$dynamic();

    const session = await auth();
    const sUser = session?.user as unknown as Record<string, unknown> | undefined;
    const isAuthenticated = !!session;

    if (id) {
      if (!isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      query = query.where(eq(operators.id, id));
    } else if (user_id) {
      if (!isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      query = query.where(eq(operators.id, user_id));
    } else if (email) {
      if (!isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      query = query.where(eq(operators.email, email));
    } else {
      query = query.where(and(eq(operators.status, 'approved'), eq(operators.hidden, false)));
    }

    if (category) {
      query = query.where(eq(operators.category, category as any));
    }

    if (q) {
      const searchTerm = `%${q}%`;
      query = query.where(
        or(
          like(operators.name, searchTerm),
          like(operators.short_desc, searchTerm),
          like(operators.long_desc, searchTerm),
        )
      );
    }

    if (lat && lng && radius) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusMeters = parseFloat(radius) * 1000;
      if (!isNaN(latNum) && !isNaN(lngNum) && !isNaN(radiusMeters)) {
        query = query.where(
          sql`earth_box(ll_to_earth(${latNum}, ${lngNum}), ${radiusMeters}) @> ll_to_earth(${operators.lat}, ${operators.lng})`
        );
      }
    }

    const result = await query
      .orderBy(operators.verified, operators.name)
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
    const { name, category, short_desc, long_desc, whatsapp, email, pricing_note, photos, tariffs, houseboat_details, shikara_details, artisan_details, lat, lng } = body;

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
