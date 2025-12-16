# Kinde Research (Fit for This Platform)

Goal: decide if **Kinde** is the right authentication/SSO layer for a multi-agency real estate platform (10–20 agencies, up to ~100 users initially), with an enterprise path.

## Snapshot (what matters most for our size)

As of Dec 2025 (check pricing before purchase):
- MAU included is far above our initial needs (50–100 total users).
- MAO (organizations/tenants) includes **50** on the entry pricing tier, which covers 10–20 agencies.
- Enterprise SSO connections: **1 included** on Free/Pro; **Unlimited** on higher tiers (meaning: if many agencies each need their own SSO connection, you’ll likely need the higher tier).

Sources:
```text
Kinde pricing: https://kinde.com/pricing/
Kinde Next.js App Router SDK: https://docs.kinde.com/developer-tools/sdks/backend/nextjs-sdk/
Okta SAML connection guide (Kinde docs): https://docs.kinde.com/authenticate/enterprise-connections/okta-saml-connection/
```

## What Kinde gives you

### 1) Next.js support (good fit)
- Kinde provides a Next.js App Router SDK (`@kinde-oss/kinde-auth-nextjs`) and recommends using the App Router SDK for Next.js 13+.  
- This matches our stack (Next.js App Router).

### 2) Multi-tenancy support via “Organizations”
- Kinde supports multi-tenancy using “Organizations” (tenant-like isolation inside Kinde).
- This helps for B2B SaaS where each agency is an “organization”.

Important: even if Kinde has orgs, **our app still needs its own tenant model** in Postgres (e.g., `agencyId`) and every query must be scoped by tenant.

### 3) Enterprise SSO (SAML / IdP connections)
- Kinde supports SAML and major enterprise identity providers (e.g., Microsoft Entra ID, Okta).
- This matters once agencies request “log in with company account”.

Practical note:
- If only 1 agency needs SSO early, the “1 included” level may be enough.
- If multiple agencies require their own SSO connections, plan for a tier with “unlimited” enterprise SSO connections.

### 4) Attack protection features
- Pricing indicates built-in protection features (DDoS, brute force, account enumeration) plus Cloudflare-related options if using Cloudflare.

## Pricing: key points to verify before committing

Even when SSO is “included”, confirm:
- how many enterprise SSO connections are included per environment/plan
- whether SAML is included in the exact plan you will pay for
- whether there are extra costs for MFA/SMS/passwordless phone
- whether SCIM provisioning is included (if you’ll need automated user provisioning later)

## What we still must build (Kinde doesn’t replace this)
- Postgres + object storage for business data and files.
- Tenant/agency membership model (e.g., `agency`, `user`, `agency_user`).
- RBAC/permissions in the platform (admin/agent/manager per agency).
- Auditing (logins + actions + content changes).

## Recommended decision path

1) Use Kinde first for:
   - email/password + social login (Google)
   - session handling in Next.js
2) Add SSO only for agencies that request it:
   - configure SAML/OIDC connection per agency
   - map IdP domains to the correct agency organization (“home realm” style routing)
3) Keep the app database as the source of truth:
   - `agencyId` in every business record
   - enforce tenant scoping in API layer

## When Kinde is a good choice for us
- We want enterprise-ready auth quickly (without building identity from scratch).
- We want to support SSO later per agency.
- We want a hosted admin console for managing auth settings.

## When we should consider alternatives
- If we need very advanced enterprise features immediately (e.g., strict SCIM provisioning, complex org structures, advanced policy controls).
- If we need deep “enterprise IAM” customization beyond the normal SAML/OIDC patterns.

## Next action (if we choose Kinde)
- Decide tenancy model:
  - “Kinde Organization = Agency” is the simplest mapping.
- Define DB tables:
  - `agency`, `user`, `agency_user`, and store `kinde_user_id` + `kinde_org_id`.
- Add server-side guards:
  - every API request must resolve `agencyId` and scope queries.
