# Data Plan (Best-Practice Approach for This Platform)

This platform needs **reliable server-backed data** (multi-device, team usage, auditability) plus **file storage** (photos, PDFs) and **background jobs** (AI generations, PDF rendering, sending).

Below is a recommended approach that is beginner-friendly but scales.

---

## 1) Recommendation (what I would choose)

### ✅ Database: Managed Postgres + Prisma

- **Managed Postgres** (pick one):
  - **Supabase Postgres** (easiest “all-in-one” dashboard + auth + storage)
  - **Neon Postgres** (great DX for serverless + branching; pair with a storage provider)
- **ORM**: **Prisma** for schema/migrations + type-safe queries.

Why this is a strong default:
- Postgres is the standard for relational business apps (real estate is relational: properties ↔ contacts ↔ deals ↔ tasks).
- Prisma is approachable and productive for teams without deep SQL background.
- Prisma migrations give you a clear, repeatable evolution path.

Connection pooling best practice (important for serverless):
- Use a **pooled connection string** for runtime queries and a **direct URL** for migrations if needed.
- References:
  - Neon + Prisma guide: https://neon.com/docs/guides/prisma
  - Prisma docs (Neon pooling + DIRECT_URL): https://www.prisma.io/docs/guides/database/neon
  - Supabase Prisma guide (create Prisma DB user): https://supabase.com/docs/guides/database/prisma

### ✅ File storage: S3-compatible object storage + signed URLs

Use object storage for:
- Gallery photos
- Generated PDFs
- AI generated images
- Signed contract PDFs (later)

Good choices:
- **Cloudflare R2** (no egress fees to many CDNs; S3-compatible)
- Supabase Storage (fine if you’re already on Supabase)

Best practice: **presigned URLs** (client uploads directly, backend stores metadata).
- Cloudflare R2 presigned URLs: https://developers.cloudflare.com/r2/api/s3/presigned-urls/

---

## 2) Why Prisma is “good” (and what to watch for)

### Pros
- Schema-driven development (easy to reason about)
- Migrations you can review + version control
- Strong TypeScript types in app code
- Great for CRUD-heavy apps (which this platform is)

### Watch-outs
- Connection management in serverless/edge contexts (fix with pooling + DIRECT_URL patterns)
- For complex reporting queries you’ll sometimes use raw SQL (totally normal)

---

## 3) Minimal backend architecture (works well with Next.js)

### App layers
1) **Next.js UI** (your dashboard)
2) **API layer** (Route Handlers or Server Actions)
3) **Database** (Postgres via Prisma)
4) **Object storage** (R2/S3)
5) **Background jobs** (for long-running tasks)

### Background jobs (recommended)
You will want async jobs for:
- AI generation polling / retries
- PDF generation
- Email sending

Pick one:
- Trigger.dev / Inngest (developer-friendly)
- BullMQ + Redis (classic, self-managed)

---

## 4) Data model (what you should store where)

### In Postgres (source of truth)
Store business entities + metadata:
- `Agency` / `User` (multi-tenant)
- `Contact` (lead/buyer/seller/investor)
- `Property`
- `MediaAsset` (photo metadata + storage key + tags + takenAt + note)
- `Deal`, `Visit`, `Task`
- `Contract` + `ContractDocument` (generated PDFs)
- `Invoice`, `Commission`
- `AiGeneration` (tool runs + result asset IDs + costs)

### In Object storage
Store large binaries:
- image files
- PDFs
- generated outputs

---

## 5) Multi-tenant strategy (Lux agencies / team usage)

Recommended pattern:
- Every row includes `agencyId`
- All queries filter by `agencyId`
- Add DB indexes on `(agencyId, createdAt)` for the main tables

Optional (later):
- Row Level Security (RLS) if you pick Supabase and want DB-enforced tenancy.

---

## 6) API patterns (so agents and MCP can use it later)

Design endpoints to be:
- **idempotent** (safe retries)
- **audited**
- **permissioned**

Examples:
- `POST /api/properties` create draft
- `POST /api/media/presign` get signed upload URL(s)
- `POST /api/media/commit` store metadata after upload
- `POST /api/pdf/generate` generate PDF and store result
- `POST /api/ai/photo-edit` enqueue AI job + track status

This is exactly what you’ll want before introducing MCP tooling.

---

## 7) Migration plan from current state (low risk)

### Step 1 — Decide hosting combo
- Option A: Supabase (Postgres + Storage + Auth)
- Option B: Neon (Postgres) + R2 (Storage) + your auth

### Step 2 — Add Prisma (schema + migrations)
- Add `prisma/schema.prisma`
- Start with core tables: Agency, User, Property, Contact, MediaAsset

### Step 3 — Replace local/mock stores gradually
- Start with **Gallery** and **Properties** (highest leverage)
- Keep fallback read paths while migrating
- Move generation histories (AI + PDFs) next

### Step 4 — Add signed URL uploads
- UI uploads directly to storage (R2/S3)
- DB stores metadata and links to property/contact

### Step 5 — Add jobs + run history
- Store `jobId`, `status`, `attempts`, `error`, `resultAssetIds`

---

## 8) What NOT to do (common pitfalls)

- Don’t store large files in the DB (images/PDFs) — store in object storage and keep keys in DB.
- Don’t let critical workflows depend on localStorage for production.
- Don’t expose raw storage credentials to the browser — use presigned URLs.

---

## 9) Decision checklist (tell me these and I’ll tailor the implementation)

1) Pick DB: **Supabase** or **Neon**
2) Pick storage: **Supabase Storage** or **Cloudflare R2**
3) Where will you host Next.js (Vercel / self-host / other)?
4) Do you need multi-agency from day 1?
5) Will you need EU-only data hosting?

