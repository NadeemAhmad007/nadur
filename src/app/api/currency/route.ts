export async function GET() {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=INR', {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return Response.json({ rates: {} });
    const data = await res.json();
    return Response.json({ rates: data.rates });
  } catch {
    return Response.json({ rates: {} });
  }
}
