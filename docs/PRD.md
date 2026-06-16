# Product Requirements Document

## 1. Product Overview

**Nadurr** is a location-based directory SaaS that connects tourists with verified service providers on Dal Lake, Srinagar. The name "Nadurr" is derived from the Kashmiri word for the lotus stem ( Nadur ), a local delicacy — symbolizing the platform's roots in Kashmiri culture and waters.

**Tagline (inferred from UI):** *"Discover the Soul of Dal Lake"*

---

## 2. Problem Statement

Tourists visiting Dal Lake face several challenges:
- No centralized directory of houseboats, shikara operators, artisans, guides, and vendors
- Difficulty verifying service quality and authenticity
- No way to compare pricing or contact providers directly
- Reliance on intermediaries (touts) who charge commissions
- Artisans and small operators lack digital presence

---

## 3. Target Users

### Primary: Tourists & Visitors
- Domestic and international tourists visiting Srinagar
- Age: 18-65
- Tech comfort: Moderate (comfortable with WhatsApp and basic web apps)
- Needs: Find and contact operators, compare options, view pricing

### Secondary: Service Providers (Operators)
- Houseboat owners, shikara drivers, artisans, guides, vendors
- Tech comfort: Low to Moderate (many use WhatsApp as primary communication)
- Needs: Digital storefront, lead generation, credibility

### Tertiary: Admin
- Platform owner/manager
- Needs: Oversee listings, approve/reject operators, moderate content

---

## 4. User Stories

### Visitor Stories
```
US-01: As a visitor, I can browse operators by category so that I find relevant services.
US-02: As a visitor, I can search operators by name or description so that I find specific providers.
US-03: As a visitor, I can find operators near my current location so that I find nearby services.
US-04: As a visitor, I can view an operator's full profile (photos, description, pricing) so that I can evaluate them.
US-05: As a visitor, I can contact an operator via WhatsApp so that I can inquire about services.
US-06: As a visitor, I can submit a lead (contact request) so that the operator can reach out to me.
US-07: As a visitor, I can view houseboat details (rooms, amenities, check-in/out times) so that I can choose accommodation.
US-08: As a visitor, I can view shikara tariffs (routes, durations, prices) so that I can plan rides.
```

### Operator Stories
```
US-09: As an operator, I can register/join the platform so that I get a digital storefront.
US-10: As an operator, I can log in via WhatsApp OTP or email OTP so that I access my dashboard.
US-11: As an operator, I can view my dashboard showing profile completion and leads so that I track my performance.
US-12: As an operator, I can edit my profile (name, description, photos, pricing) so that my listing is accurate.
US-13: As an operator, I can upload photos so that my profile is visually appealing.
US-14: As an operator, I can view leads I've received so that I can follow up with potential customers.
US-15: As an operator, I can see my profile completion score so that I know what's missing.
```

### Admin Stories
```
US-16: As an admin, I can view all operators so that I oversee the platform.
US-17: As an admin, I can approve/reject/suspend operators so that the platform maintains quality.
US-18: As an admin, I can view all leads so that I track platform activity.
US-19: As an admin, I can see a leaderboard of operators by lead count so that I identify top performers.
```

---

## 5. Functional Requirements

### FR-01: Public Directory
| ID    | Description | Priority |
|-------|-------------|----------|
| FR-01a | List operators with pagination | P1 |
| FR-01b | Filter by category (houseboat, shikara, artisan, guide, vendor) | P1 |
| FR-01c | Full-text search by name, short_desc, long_desc | P1 |
| FR-01d | Geospatial filter: "Near Me" with configurable radius | P1 |
| FR-01e | Grid view with operator cards (photo, name, category, short_desc, CTA) | P1 |
| FR-01f | Skeleton loading states during data fetch | P2 |

### FR-02: Operator Profiles
| ID    | Description | Priority |
|-------|-------------|----------|
| FR-02a | Public profile at /op/[slug] | P1 |
| FR-02b | Display name, category, description (short + long) | P1 |
| FR-02c | Photo gallery (carousel) from Cloudinary | P1 |
| FR-02d | WhatsApp contact button (deep link) | P1 |
| FR-02e | Lead submission form | P1 |
| FR-02f | Category-specific sections (houseboat_details, shikara_details) | P2 |
| FR-02g | Pricing / tariffs display | P2 |
| FR-02h | Location map with Leaflet | P2 |

### FR-03: Authentication
| ID    | Description | Priority |
|-------|-------------|----------|
| FR-03a | Google OAuth login | P1 |
| FR-03b | Email OTP login (6-digit code via Resend) | P1 |
| FR-03c | WhatsApp OTP login (6-digit code) | P2 |
| FR-03d | Session management via JWT | P1 |
| FR-03e | Route protection for /portal and /admin | P1 |
| FR-03f | Stale session detection and cleanup | P2 |

### FR-04: Operator Dashboard
| ID    | Description | Priority |
|-------|-------------|----------|
| FR-04a | Profile completion score (progress bar) | P1 |
| FR-04b | Lead count display | P1 |
| FR-04c | Navigation to edit profile | P1 |
| FR-04d | Recent leads list | P2 |

### FR-05: Profile Editing
| ID    | Description | Priority |
|-------|-------------|----------|
| FR-05a | Edit name, slug, description, contact info | P1 |
| FR-05b | Upload/change photos via Cloudinary widget | P1 |
| FR-05c | Category-specific fields (houseboat rooms, shikara routes, etc.) | P2 |
| FR-05d | Save changes (PATCH /api/operators/[slug]) | P1 |
| FR-05e | Form validation with error messages | P2 |

### FR-06: Admin Panel
| ID    | Description | Priority |
|-------|-------------|----------|
| FR-06a | List all operators with category, status, lead count | P1 |
| FR-06b | Approve/reject/suspend operators | P1 |
| FR-06c | View all leads with operator info | P2 |
| FR-06d | Leaderboard sorted by lead count (descending) | P2 |

### FR-07: Lead Management
| ID    | Description | Priority |
|-------|-------------|----------|
| FR-07a | Submit lead from operator profile | P1 |
| FR-07b | Associate lead with session_id (anonymous tracking) | P1 |
| FR-07c | Track lead source (profile, browse, etc.) | P2 |
| FR-07d | View leads in operator dashboard | P2 |
| FR-07e | View all leads in admin panel | P2 |

### FR-08: Geospatial Features
| ID    | Description | Priority |
|-------|-------------|----------|
| FR-08a | Store lat/lng for each operator | P1 |
| FR-08b | Earthdistance-based radius search | P1 |
| FR-08c | Display operator location on Leaflet map | P2 |
| FR-08d | Reverse geocode from address (INFERRED) | P3 |

---

## 6. Non-Functional Requirements

| ID    | Requirement | Target |
|-------|-------------|--------|
| NFR-01 | Page load time (LCP) | < 3s on 3G |
| NFR-02 | API response time | < 500ms p95 |
| NFR-03 | Uptime | 99.5% |
| NFR-04 | Mobile responsiveness | All pages mobile-first |
| NFR-05 | Accessibility | WCAG 2.1 AA |
| NFR-06 | SEO | Each operator profile indexable |
| NFR-07 | Security | HTTPS, CSP, rate limiting |
| NFR-08 | Database query performance | Indexed for common queries |
| NFR-09 | Static generation | Operator profiles ISR/SSG |

---

## 7. Out of Scope (v0.1)

- Payment processing / Stripe integration
- Multi-language support (Hindi i18n exists in schema but not implemented)
- Booking / reservation system
- In-app messaging (WhatsApp deep link only)
- Mobile app (progressive web app not configured)
- Reviews and ratings
- Operator analytics dashboard
- Automated lat/lng geocoding from address
- Email notifications for new leads
- Rate limiting and DDOS protection
- Unit/E2E tests
- CI/CD pipeline
- Docker containerization

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Registered operators | 500+ in first 6 months | DB count |
| Monthly leads | 1,000+ | DB count |
| Profile completion rate | > 70% | Operators with all fields filled |
| Visitor-to-lead conversion | > 5% | Leads / unique visitors |
| Operator retention | > 80% after 3 months | Active logins |
| Page load time | < 3s | Lighthouse audit |

---

## 9. Release Criteria

**v0.1-alpha:**
- [x] All 5 category pages rendering
- [x] Browse page with search and category filter
- [x] Operator profiles with photo gallery and WhatsApp contact
- [x] Google OAuth and OTP login working
- [x] Operator dashboard and edit profile
- [x] Admin approval workflow
- [x] Lead capture from profiles
- [x] Geospatial "Near Me" filter
- [x] Seed data for 171 artisans

**v0.1-beta (next):**
- [ ] Payment/billing integration
- [ ] Rate limiting on API endpoints
- [ ] Email notifications for new leads
- [ ] Hindi language support
- [ ] PWA manifest and service worker
- [ ] E2E tests with Playwright
- [ ] CI/CD with GitHub Actions
- [ ] Automated lat/lng from address
- [ ] Reviews and ratings system
- [ ] Operator analytics dashboard
