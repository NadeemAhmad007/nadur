'use client';

export async function lookupPincode(pincode: string): Promise<{ city: string; district: string; state: string } | null> {
  if (!/^\d{6}$/.test(pincode)) return null;

  try {
    const res = await fetch(
      `https://indianpincode.com/api/pincode/${pincode}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.city) return null;
    return {
      city: data.city || '',
      district: data.district || '',
      state: data.state || '',
    };
  } catch {
    return null;
  }
}
