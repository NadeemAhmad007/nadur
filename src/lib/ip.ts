export function getClientIp(req: Request): string {
  return req.headers.get('x-real-ip')
    || req.headers.get('x-vercel-forwarded-for')
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'anon';
}
