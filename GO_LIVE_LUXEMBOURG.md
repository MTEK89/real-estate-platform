# Go‑Live Checklist (Luxembourg)

This is the shortest path to a **credible “live next”** release for Luxembourg real‑estate agencies: stable auth + data isolation, Luxembourg‑correct billing/invoices, and Luxembourg market defaults.

## 0) Non‑negotiables (before demos)

### Auth & tenancy (already started)
- **Supabase Auth** as the single source of truth for users and sessions.
- **RLS enforced everywhere** (no demo headers, no “local fallback” for critical flows).
- **Agency membership required**: if a user has no `agency_users` row, redirect to onboarding (create agency).

### Production data posture
- Disable demo seeding in production (`DEMO_MODE` must be off; seed endpoint only for internal).
- Backups + audit logs + basic observability (errors, API latency, auth failures).

## 1) Luxembourg market defaults (product)

### Portals (Luxembourg)
Make the default portal list Luxembourg‑correct and remove US‑centric portals:
- `atHome.lu` citeturn1search0turn1search7
- `IMMOTOP.LU` citeturn1search5turn1search2
- `Wortimmo.lu` (keep if you support it; confirm official endpoint/branding in UI copy)
- `vivi.lu` citeturn2search0turn2search5

### Languages & formatting
- Support FR/DE/EN as first‑class UI languages (PT optional; Luxembourg users often expect it).
- Locale formatting:
  - Currency: `EUR` (e.g. `1 250 000,00 €`)
  - Dates: `dd/mm/yyyy`
  - Phone: `+352 …`
  - Address fields: `Street`, `Postal code`, `City`, `Country` (Lux often uses “L‑####” formatting).

### Documents (Luxembourg realism)
For each “contract/doc” generator, make these Luxembourg‑ready:
- Mandatory fields: parties, address, property reference, fees/commission, VAT treatment, signatures, annexes.
- Keep the “Mandate” PDF design system as the single base template style.
- Add Luxembourg‑specific disclaimers (energy certificate, data protection, etc.) as optional sections (agency‑configurable).

## 2) Invoicing (Luxembourg baseline)

### Required invoice fields (TVA compliant)
Your invoice PDF + UI should capture and print (at minimum):
- Issue date
- Unique sequential invoice number
- Supplier VAT number
- Supplier + client full name + address
- Supply/service date (if different)
- Quantity + nature of services
- Net price / tax base per VAT rate
- VAT rate + VAT amount per rate
- If VAT not due: reason/mention
- If reverse charge applies: show “Autoliquidation” (when applicable) citeturn3view0

### VAT defaults
- Default VAT rate for services is commonly the **standard rate**; Luxembourg reverted to **17% from 01/01/2024** after the temporary 2023 cut. citeturn0search9
- Implement VAT as a **configurable setting per agency** (some agencies may invoice 0% in certain cases or if not VAT registered).

## 3) Compliance & security (minimum “sellable” bar)

### Data protection (GDPR + Luxembourg)
- Data retention settings (how long to keep leads/messages).
- Export + deletion requests (basic tooling).
- Audit logging for critical actions (contact export, user invites, document downloads).

### Security controls
- Enforce MFA-ready auth (Supabase supports MFA; at least plan for it).
- Rate limiting + abuse protection for public endpoints (upload, AI generation).
- Secrets in environment only (never in client bundle).

## 4) Product quality: what must be “boring” (no surprises)

### Reliability
- Remove “silent” fallback states (local mock persistence) for core CRM data; if the backend fails, show a clear banner and retry.
- Add a simple `/api/v1/auth/session` debug view (already added) to diagnose login/agency membership fast.

### UX consistency
- Standardize action buttons (Preview/Download/etc.) placement across all document tools (same component).
- Replace “Coming Soon” empty pages with a **clear roadmap tile** and a CTA (collect interest / waitlist / “Request feature”).

## 5) Go‑Live order (recommended)

1. **Auth + onboarding stable** (no loops; clean redirects; password reset works).
2. **Core CRM data** (contacts/properties/tasks) fully server‑backed with RLS.
3. **Gallery** (upload → assign property → timestamps → export ZIP) fully reliable.
4. **Mandate‑style PDFs** for the top 3 documents used daily.
5. **Invoice** creation + PDF that meets Luxembourg TVA invoice rules.
6. Portals publishing automation (start with exports + manual “configure” tokens; automate later).

## 6) What we should build next in this repo

- Settings persistence to DB (agency profile, invoice numbering series, VAT number, branding logo).
- Invitations (agency owner invites users; membership provisioning).
- Feature flags (so “Coming Soon” can ship hidden but safely).
- A “Demo mode” toggle that creates sandbox data without contaminating production agencies.

