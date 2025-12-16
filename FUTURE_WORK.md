# Future Work / Roadmap (Platform)

This file captures agreed future work items so we can come back later without losing context.

## AI (fal.ai / Nano Banana)

### AI Photo Tools (Real Estate)
- Add more curated “top 1–2” options per scenario (avoid overwhelming agents).
- Add better “batch” workflows (apply same edit to multiple photos).
- Add auto-save results back into Gallery and attach to the property.
- Add model/version pinning for Nano Banana via `FAL_NANO_BANANA_MODEL_ID` + `FAL_NANO_BANANA_SUBPATH`.
- Add usage tracking per user/property (quota + billing hooks).

### AI Headshot Photographer
- Add more curated styles (keep to 3–6 max).
- Add a “branding watermark” option for agency logo on headshots (non-AI).
- Add team headshot batch mode + consistent lighting/background.

## Signatures (Contracts)

### Build “our own” signature workflow (MVP)
- Contract state machine:
  - `draft` → `pending_signature` → `signed` / `declined` / `expired`
  - `signatureMethod`: `electronic` | `scanned` | `manual`
- Generate a signer link per contract (tokenized).
- Signer page:
  - view PDF
  - draw signature / type signature / upload signature image
  - optional initials per page
- Produce a signed PDF:
  - embed signature image(s) + date/time + signer name
  - add an audit page (hash, timestamps, IP, user agent)
- Store audit trail per contract.

### Scanned signature (workflow)
- Upload scanned signed PDF.
- Link upload to contract + mark as `signed`.
- Optional: request “agent verification” checklist before marking signed.

### Manual / physical signature (workflow)
- Checklist: print → sign → collect → scan/store.
- Reminders + status tracking + due dates.

### Later: provider-grade compliance (optional)
- If needed for higher legal assurance: integrate a provider (DocuSign / Yousign) for advanced/qualified signatures.

## UX / Platform Health

### “No dead buttons”
- Continue auditing UI for non-functional actions.
- Prefer either:
  - real navigation/action, or
  - explicit “Coming soon” toast/disabled state (never silent dead-click).

### Hydration safety
- Avoid nested interactive elements (e.g., `<button>` inside `<button>`).
- Avoid SSR/client mismatches for Radix ids:
  - Prefer mounting guards for components known to mismatch in this setup.

## Data & Storage
- Move “local only” features to real persistence:
  - Gallery metadata + blobs sync to backend storage (S3/R2/Supabase).
  - AI generations history persisted per user and property.
  - Signature artifacts persisted securely.

