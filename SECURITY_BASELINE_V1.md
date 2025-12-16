# Security Baseline v1 (Enterprise SaaS — Real Estate Platform)

This is a practical, high-signal security plan you can execute without a deep security background. It’s written for a multi‑agency real estate SaaS that stores PII, photos, PDFs, and uses AI tools.

**Goal**: prevent the most common SaaS breaches:
- cross‑tenant data leaks
- account takeover
- insecure file access
- unsafe integrations (AI/tools/SSRF)
- missing auditability

---

## 1) Threat model (what we’re defending against)

### Primary risks (highest impact)
1) **Tenant isolation failure**: Agency A can access Agency B’s contacts/properties/photos/docs.
2) **Account takeover**: weak passwords, phishing, missing MFA, session hijacking.
3) **Insecure file access**: public bucket, guessable URLs, PDFs containing PII.
4) **Broken access control (IDOR)**: user can access `/api/.../123` belonging to another agency.
5) **Sensitive data exposure**: logs, analytics, client-side storage, error traces.

### Secondary risks
6) **File upload abuse**: malware PDFs/images, zip bombs, storage flooding.
7) **SSRF**: server fetches arbitrary URLs (if you allow “import from URL”).
8) **Prompt injection / tool abuse**: AI agents executing unsafe actions.
9) **Supply chain**: dependency vulnerabilities.

---

## 2) Non-negotiables (must have before enterprise)

### A) Multi-tenancy enforcement
- Every row has `agencyId` (or tenant id).
- Every query is scoped by `agencyId` (no exceptions).
- Add automated tests that attempt cross-tenant reads/writes and must fail.

Best options:
- **DB-level enforcement** (strongest): Row Level Security (RLS) if using Supabase.
- **App-level enforcement**: centralized query layer that requires `agencyId` for every data operation + tests.

### B) Auth/session hardening
- MFA for admins (TOTP at minimum).
- Secure sessions (HttpOnly cookies, Secure, SameSite).
- Session rotation and logout on password change / role change.
- Rate limiting on login.

### C) Secure file storage
- Private bucket by default.
- All downloads are via **signed URLs** with short expiration.
- Uploads via **signed URLs** (no permanent storage keys in the browser).
- Virus scan pipeline for PDFs (at least for enterprise tiers).

### D) Audit logs
- Immutable audit entries for:
  - login/logout
  - role/permission changes
  - deletes
  - exports/downloads
  - publishing listings
  - invoice send/paid status
  - contract status changes (later: signatures)

Minimum fields:
`id, agencyId, actorUserId, action, entityType, entityId, before, after, ip, userAgent, createdAt`.

---

## 3) Recommended architecture (secure by design)

### Data
- Postgres for structured data (properties, contacts, deals, tasks).
- Object storage for blobs (photos, PDFs, AI outputs).

### APIs
- All mutations go through server endpoints (no localStorage source-of-truth).
- Enforce:
  - authentication
  - authorization
  - tenant scoping
  - validation (Zod)

### Jobs/queue
- AI generation, PDF generation, email sending use background jobs.
- Jobs are idempotent and produce audited results.

---

## 4) Practical control checklist (what to implement)

### Identity & Access
- [ ] Roles per agency: `owner/admin/manager/agent/viewer`.
- [ ] Permission checks for every write endpoint.
- [ ] MFA for admin roles.
- [ ] SSO (optional per agency): domain verification + correct routing.

### Web security
- [ ] CSRF protection (if cookie auth is used for APIs).
- [ ] XSS protection: avoid dangerous HTML rendering; sanitize any rich-text.
- [ ] Security headers:
  - Content-Security-Policy (CSP)
  - Strict-Transport-Security (HSTS)
  - Referrer-Policy
  - Permissions-Policy
  - frame-ancestors (clickjacking protection)

### File upload security
- [ ] Validate mime type + file signature (don’t trust extensions).
- [ ] Max size limits (per file + per request).
- [ ] Virus scanning (ClamAV or managed scanner) for PDFs and office files.
- [ ] Quotas per agency/user.

### SSRF protection (important if you fetch URLs)
- [ ] Allowlist external domains (or disable arbitrary URL fetch).
- [ ] Block private IP ranges (169.254/127.0.0.0/10.0.0.0 etc.).
- [ ] DNS rebinding protections (resolve + re-check IP).

### Logging & monitoring
- [ ] Central log store (with redaction of tokens/PII).
- [ ] Alerting on:
  - repeated failed logins
  - cross-tenant access attempts
  - unusually large exports/downloads

### Dependency & supply chain
- [ ] Dependabot (or equivalent) enabled.
- [ ] `npm audit`/Snyk scans in CI.
- [ ] Lockfile committed.

---

## 5) AI / Agent safety (future, but design now)

If you add MCP/agents:
- Treat tool calls as “remote code execution of business actions”.
- Treat Supabase MCP (DB-level tools) as privileged access; start with staging + read-only.
- Require approvals for:
  - publish/send/delete/export
  - invoice generation/mark paid
  - signature requests
- Log every tool call (args + outputs).
- Rate limit and add spending caps (AI cost control).
- Allowlist egress domains.

---

## 6) “Enterprise readiness” add-ons

When enterprise customers ask for it:
- SSO + enforced MFA via IdP policies
- SCIM provisioning (auto user create/deactivate)
- Per-tenant encryption keys (KMS envelope encryption)
- Data retention policies + legal hold
- Pen test + remediation cycle
- SOC 2 readiness work (process + controls)

---

## 7) Suggested next actions (minimal path)

1) Decide the “source of truth” backend stack:
   - Supabase (Postgres + RLS + Storage) or
   - Postgres (Neon/AWS) + S3/R2 + your auth vendor
2) Implement tenant scoping everywhere (DB + API guards).
3) Move Gallery + PDFs to object storage with signed URLs.
4) Add audit logs.
5) Add rate limiting and security headers.
