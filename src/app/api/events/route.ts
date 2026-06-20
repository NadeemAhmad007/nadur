const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;

export async function GET() {
  if (!TICKETMASTER_API_KEY) {
    return Response.json({ events: [] });
  }

  try {
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    const endDate = sixMonthsFromNow.toISOString().split('T')[0];

    const res = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&countryCode=IN&city=Srinagar&size=10&sort=date,asc&endDateTime=${endDate}T23:59:00Z`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return Response.json({ events: [] });

    const data = await res.json();
    const events = (data._embedded?.events ?? []).map((e: any) => ({
      name: e.name,
      date: e.dates?.start?.localDate || '',
      url: e.url,
      venue: e._embedded?.venues?.[0]?.name || 'Srinagar',
    }));

    return Response.json({ events });
  } catch {
    return Response.json({ events: [] });
  }
}
