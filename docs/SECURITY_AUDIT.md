# Security Audit

> **Status:** Preliminary review — v0.1-alpha  
> **Date:** 2026-06-13  
> **Severity Scale:** Critical / High / Medium / Low / Informational

---

## 1. Authentication Security

| Issue | Severity | Description | Recommendation |
|-------|----------|-------------|----------------|
| **Hardcoded admin email** | High | Admin is identified by `nadeemkolu22@gmail.com` hardcoded in JWT callback. Changing admin requires code deploy. | Store admin emails in DB or env var. |
| **OTP stored in plaintext** | Medium | OTP codes stored as plain TEXT in `email_verifications` and `phone_verifications` tables. | Hash OTPs with a fast hash (SHA-256). |
| **No OTP rate limiting** | Medium | `attempts` column exists but no code enforces max attempts or cooldown period. | Check `attempts >= 3` before allowing verification; implement cooldown. |
| **OTP expiry not enforced** | Medium | `expires_at` column exists but code may not check it. | Verify `NOW() < expires_at` in OTP verification query. |
| **JWT secret strength** | Low | Depends on `AUTH_SECRET` env var quality. | Ensure `AUTH_SECRET` is a strong random string (min 32 chars). |
| **Session not revocable** | Low | No session store — JWT strategy means tokens can't be revoked server-side. | Consider database sessions for revocability. |
| **No MFA** | Informational | Single-factor authentication only (OTP or OAuth). | Consider MFA for admin accounts. |

---

## 2. API Security

| Issue | Severity | Description | Recommendation |
|-------|----------|-------------|----------------|
| **No rate limiting** | High | All API endpoints are unprotected against abuse/bot attacks. | Implement rate limiting (Vercel KV, Upstash, or middleware-based). |
| **No API key validation** | High | Public endpoints (`POST /api/leads`, `POST /api/operators`) accept requests from any origin. | Add CSRF protection; validate origin/referrer headers. |
| **No input sanitization** | Medium | User input stored as-is in DB; potential XSS risk if rendered unsafely. | Sanitize HTML in descriptions; use `textContent` not `innerHTML`. |
| **IDOR in PATCH /api/operators** | Medium | Relies on session email/operator_id match; no explicit ownership check on the operator slug. | Verify `operator_id` from session matches the operator being edited. |
| **No request validation library** | Medium | No Zod or similar schema validation; relies on manual checks. | Add Zod schemas for all API inputs. |
| **No CORS configuration** | Low | CORS headers not explicitly configured (Vercel defaults apply). | Configure CORS if API is consumed by external clients. |
| **Verbose error messages** | Low | API returns detailed error messages that could leak information. | Return generic errors in production. |

---

## 3. Data Security

| Issue | Severity | Description | Recommendation |
|-------|----------|-------------|----------------|
| **WhatsApp numbers publicly exposed** | Medium | Phone numbers are visible on public profiles and embedded in WhatsApp deep links. | Consider showing numbers only after lead submission. |
| **No data encryption at rest** | Medium | DB connection is TLS-encrypted (Neon default), but sensitive fields (phone, email) are not encrypted. | Encrypt PII columns at application level. |
| **No data retention policy** | Medium | Lead data and verification records stored indefinitely with no cleanup. | Implement TTL/cron job to purge old records. |
| **Session ID in localStorage** | Low | Visitor tracking via localStorage `session_id` — no PII but enables cross-page tracking. | No change needed; document in privacy policy. |
| **No backup strategy visible** | Medium | No backup configuration for Neon database. | Configure automated DB backups in Neon dashboard. |

---

## 4. Infrastructure Security

| Issue | Severity | Description | Recommendation |
|-------|----------|-------------|----------------|
| **No CSP headers** | High | Content Security Policy not configured; vulnerable to XSS and data injection attacks. | Add CSP headers in `next.config.ts` or `vercel.json`. |
| **No HTTPS enforcement** | Medium | Vercel provides HTTPS by default, but no explicit redirect from HTTP. | Enable HSTS headers. |
| **Cloudinary unsigned uploads** | Medium | `CldUploadButton` may use unsigned uploads (depends on config). | Use signed uploads withCloudinary. |
| **S3 credentials in env but unused** | Informational | S3 keys exist in env but unused; potential credential leak surface. | Remove unused S3 env vars. |
| **No WAF** | Informational | No Web Application Firewall configured. | Consider Vercel WAF or Cloudflare. |

---

## 5. Dependency Security

| Issue | Severity | Description | Recommendation |
|-------|----------|-------------|----------------|
| **NextAuth v5 beta** | Medium | Beta version may have undiscovered vulnerabilities. | Monitor for stable release; keep updated. |
| **Outdated dependencies** | Low | Run `npm audit` to check for known CVEs. | Regularly run `npm audit fix`. |
| **No SRI for external scripts** | Low | Leaflet CSS/JS loaded from CDN without Subresource Integrity. | Add SRI attributes to external script loads. |

---

## 6. Authentication Bypass Risks

| Risk | Severity | Description |
|------|----------|-------------|
| **proxy.ts vs middleware.ts** | Critical | The route guard is in `proxy.ts` but Next.js expects `middleware.ts` in `src/`. If the file isn't registered, `/admin` and `/portal` routes are **unprotected**. | Rename to `middleware.ts` or confirm it's registered. |
| **Client-side admin check only in /admin** | High | Admin page checks `is_admin` in useEffect and redirects; a savvy user could bypass client-side check. | Server-side check in `proxy.ts` must be functional. |
| **JWT callback email lookup fails for OTP users** | Medium | Fixed by adding `user.id` fallback; without this, OTP-authenticated operators get no `operator_id` in session. | Verify fix is deployed. |

---

## 7. Session Management Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| **Old JWT tokens retain stale data** | Medium | Tokens issued before `operator_id` enrichment don't get updated until re-login. | Mitigated by stale session detection on login page. |
| **No refresh token rotation** | Low | JWT tokens expire after 30 days with no refresh mechanism. | Acceptable for current scale. |
| **Session not cleared on sign-out from all tabs** | Low | signOut() clears current tab; other tabs may have stale session. | Use broadcast channel API or server-sent events. |

---

## 8. Secrets Management

| Secret | Location | Risk |
|--------|----------|------|
| `AUTH_SECRET` | `.env` | Must NOT be committed to git |
| `DATABASE_URL` | `.env` | Contains credentials; `.env` is in `.gitignore` |
| `CLOUDINARY_API_SECRET` | `.env` | Exposure would allow image manipulation |
| `RESEND_API_KEY` | `.env` | Exposure would allow sending emails from the app |
| `WHATSAPP_API_KEY` | `.env` (INFERRED) | Exposure would allow sending messages |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `.env` + client | Public by design (embedded in client JS) |

---

## 9. Vulnerability Summary

```
CRITICAL:  1 — proxy.ts vs middleware.ts naming mismatch
HIGH:      6 — Hardcoded admin, no rate limiting, no CSP, client-side admin guard,
                OTP exposure, middleware naming
MEDIUM:    8 — OTP plaintext, no rate limit enforcement, IDOR risk, phone exposure,
                unsigned uploads, no data retention, no backup strategy, input sanitization
LOW:       4 — JWT secret strength, verbose errors, outdated deps, no SRI
INFO:      4 — No MFA, S3 creds unused, no WAF, old token issue
```

---

## 10. Immediate Action Items

1. **Rename `proxy.ts` to `middleware.ts`** — or verify the current file is being picked up by Next.js
2. **Add CSP headers** — prevent XSS attacks
3. **Implement rate limiting** — protect API endpoints from abuse
4. **Enforce OTP expiry and max attempts** — prevent brute-force OTP attacks
5. **Add input validation library (Zod)** — sanitize all API inputs
6. **Remove hardcoded admin email** — use environment variable or DB lookup
7. **Add server-side ownership verification** — confirm operator owns profile before PATCH
8. **Run `npm audit`** — check for known vulnerabilities in dependencies
