# MCP + Agents Roadmap (Turning the Vision into Reality)

This document proposes a best‑practice way to expose **all platform tools** to AI agents via **MCP (Model Context Protocol)**, while keeping the system reliable, secure, and maintainable.

It’s written for *this* platform: real-estate operations + documents + media + AI photo tools + finance.

**Research notes**: MCP is an open standard for connecting AI assistants to external systems and has rapidly become a common interoperability layer. See Anthropic’s intro announcement for MCP background and architecture.  
Reference: https://www.anthropic.com/news/model-context-protocol

---

## 0) Why MCP (and what it implies)

MCP is designed to standardize how an AI “host” (Claude/ChatGPT/your custom agent UI) connects to external **tools** and **data**. MCP separates:

- **Resources**: read-only access to data (think “GET”).
- **Tools**: actions with side effects (think “POST/PUT/DELETE”).
- **Prompts**: reusable instruction patterns (optional).

Practical implication: if your platform features are **UI-only** or **localStorage-only**, an MCP agent will be brittle. Agents need **stable server-backed capabilities**.

**Takeaway**: MCP works best when it wraps *real APIs/services*, not just frontend state.

---

## 1) The core requirement for “all tools”: reliability

“All tools available to agents” is feasible *if* each tool:

1) Has **server-side persistence** (DB/files), not only local state.
2) Is **idempotent** (safe to retry).
3) Has predictable **validation and errors**.
4) Has **authorization + audit logs**.
5) Can run without a browser (agents may run headless).

If any tool doesn’t meet these properties, the agent may appear to “work” sometimes and fail randomly.

---

## 2) Recommended architecture (best practice)

### A) “Tool Gateway” MCP Server (single entrypoint)

Create one MCP server that exposes your platform capabilities as tools/resources:

- MCP Server: `real-estate-platform-mcp`
- Talks to: your platform API (REST/GraphQL) + storage + job queue
- Auth: uses platform auth tokens (impersonation via user session or service account)

Why this is best:
- One place to enforce permissions, throttling, logging, and safety policies.
- Tools can evolve without changing the agent/LLM.

### B) Your existing platform stays the source of truth

Do **not** let the agent write to localStorage/IndexedDB directly. Instead:
- agent calls MCP tool
- MCP tool calls platform API
- platform persists to DB/storage
- UI reads from platform API

---

## 3) Multiple agents: yes (but keep one tool layer)

Having multiple agents (each responsible for a domain) is a good idea.

Use a **supervisor pattern**:
- **SupervisorAgent**: reads the user request, selects which specialist to use, and orchestrates steps.
- **Domain agents** (examples):
  - `MediaAgent`: Gallery, watermark, AI photo edits, asset tagging
  - `MarketingAgent`: listings, portals, campaigns, posting assets
  - `DocsAgent`: generate PDFs, brochure/mandate/contract docs, attach to property
  - `OpsAgent`: tasks, visits, follow-ups, reminders
  - `FinanceAgent`: invoices/commissions, export, payment status

Important: you still expose tools via **one MCP server** (or multiple MCP servers if you want hard security boundaries).

---

## 4) Tool design guidelines (what “good” tools look like)

### Keep tool count small and composable

Agents don’t need 100 micro-tools. Start with ~15–25 “power tools”.

Bad:
- `setListingHeadlineCharacterByCharacter(...)`

Good:
- `marketing.createOrUpdateListing({ propertyId, portals, content })`

### Make side-effect tools idempotent

All write tools should accept an `idempotencyKey` and return the created/updated ids.

Example:
```ts
gallery.uploadMedia({
  propertyId,
  files: [...],
  idempotencyKey: "upload:prop-123:2025-12-14T10:00Z"
})
```

### Return structured outputs

Tools should return machine-friendly JSON:
- created ids
- URLs
- status
- warnings

### Add “dry run” / “plan” capability for risky actions

For destructive actions:
- `simulate: true` returns what would happen
- require explicit `confirm: true` for execution

---

## 5) Human-in-the-loop approvals (critical for real estate)

You should require confirmation for:
- publishing listings
- sending emails/SMS
- deleting anything
- generating invoices or marking paid
- sending signature requests

This is a well-known “human-in-the-loop” pattern for tool execution in agent systems: the run pauses, the UI asks for approval, then resumes with the approval input.  
References:
- OpenAI Agents SDK “Human in the loop”: https://openai.github.io/openai-agents-js/guides/human-in-the-loop/
- Microsoft Agent Framework tutorial on approvals: https://learn.microsoft.com/en-us/agent-framework/tutorials/agents/function-tools-approvals

Implement this as:
- MCP tool returns `requiresApproval: true` + `approvalToken`
- UI shows a confirmation modal
- UI calls `approveAction({ approvalToken })`

---

## 6) Observability (so it’s debuggable)

Agents will fail in weird ways unless you can inspect runs.

Minimum:
- `agent_runs` table (run id, user id, prompt, tool calls, timestamps)
- `tool_calls` table (inputs, outputs, error, duration)
- correlation ids across MCP → API → jobs

Add:
- dashboards for error rate, latency, cost
- replay tooling (run again with same inputs)

---

## 6.1) Security: tool poisoning, malicious servers, and safe execution

Tool-calling + MCP increases the “agent attack surface” (prompt injection, malicious tool descriptors, poisoned servers, unsafe side effects). This is not theoretical; there is active research describing MCP-specific issues like tool poisoning and ecosystem attacks.

Suggested defenses (practical best practices):
- **Allowlist + provenance**: only run MCP servers you ship/control; avoid “random aggregator installs”.
- **Signed manifests**: sign tool descriptors/manifests and verify signatures at runtime (prevents “descriptor rug-pull”).
- **Runtime policy**: guardrails on tool arguments + destination allowlists (e.g., where uploads can go, which domains can be fetched).
- **Least privilege tokens**: scoped tokens per tool domain and per tenant/agency.
- **Human approval** for any risky or externally-visible action (publish/send/delete).
- **Audit everything**: tool args, results, diffs, and actor identity.

Research references (for awareness and threat modeling):
- MCP Safety Audit (arXiv): https://arxiv.org/abs/2504.03767
- Attack vectors in MCP ecosystem (arXiv): https://arxiv.org/abs/2506.02040
- Security + maintainability study of MCP servers (arXiv): https://arxiv.org/abs/2506.13538

---

## 7) Where you likely need a “separate frontend”

Feasible options:

### Option 1 (recommended): assistant inside the platform
- A “side panel” inside the dashboard that:
  - accepts requests
  - shows step-by-step tool calls
  - asks for confirmations
  - links outputs (gallery items, PDFs, listings)

Pros: zero context switching for agents.

### Option 2: separate “Agent Console”
- Used by internal staff for debugging + operations.

Pros: faster iteration; you can lock it down tightly.

Most teams end up with both:
- embedded assistant for users
- console for admins/operators

---

## 8) A realistic phased plan (recommended)

### Phase 0 — Make the platform “agent-ready”
- Move critical data from mock/local to DB:
  - Properties, Contacts, Deals, Visits, Tasks
  - Gallery media (metadata + blobs)
  - PDF artifacts (generated PDFs + metadata)
- Remove dead buttons and undefined workflows (or mark clearly “Coming soon”).

### Phase 1 — Define the MCP Tool Catalog (15–25 tools)
Start with the top workflows:
1) Create property + upload photos + tag + choose cover
2) Run AI photo edits (declutter/twilight/sky/staging) + save back to property/gallery
3) Generate brochure / listing presentation PDF + attach to property
4) Create marketing listing + publish to portals (even if “mock publish” initially)
5) Create tasks/visits from a lead + reminders

### Phase 2 — Implement MCP Server (Tool Gateway)
- MCP server in Node (TypeScript SDK)
- connects to platform API
- auth + permissions + audit logging
- rate limits

### Phase 3 — Ship the assistant UI
- Streaming chat UI
- “Run steps” view
- approvals
- run history

### Phase 4 — Add multi-agent orchestration
- Supervisor routes to domain agents
- evaluation harness + golden test cases

### Phase 5 — Expand tool coverage
- add finance exports, campaigns, inbox/email triage, etc.

---

## 9) Suggested initial MCP tools (example list)

### Resources (read-only)
- `property.get({ propertyId })`
- `property.search({ query, status })`
- `gallery.list({ propertyId, tags, dateRange })`
- `documents.list({ propertyId })`

### Tools (actions)
- `property.createDraft({ address, type, ownerContactId })`
- `contact.create({ firstName, lastName, type, email, phone })`
- `gallery.upload({ propertyId, files[], takenAt, tags[] })`
- `gallery.assignCover({ propertyId, mediaId })`
- `watermark.apply({ mediaId, preset, textOrLogo, outputTarget })`
- `ai.photo.edit({ tool: "declutter"|"twilight"|..., mediaId, variants, saveToGallery })`
- `pdf.generate({ type, propertyId, contactId, brandConfig, saveAs })`
- `marketing.listing.upsert({ propertyId, portals, headline, description })`
- `task.create({ title, dueDate, relatedTo })`
- `visit.create({ propertyId, contactId, date, startTime, endTime })`

---

## 10) Security model (do not skip)

Minimum requirements:
- MCP server authenticates requests (bearer tokens)
- every tool checks:
  - user permission
  - tenant/agency isolation
  - object ownership
- audit log for:
  - who triggered a tool
  - what changed
  - before/after snapshot (for key objects)

Recommended additions:
- **Idempotency keys** for every write tool (safe retries).
- **Rate limits** per user/tenant to avoid accidental runaway loops.
- **Separate “read” vs “write” tool scopes**; consider a strict policy mode for production.
- **Egress controls** (if any tool can fetch URLs): restrict domains, block private network ranges.

---

## 11) Notes specific to this repo (current state)

Today, parts of the platform are still:
- UI-only actions / “coming soon” placeholders
- local persistence (localStorage/IndexedDB)

For MCP agents to reliably operate:
- move these features behind server APIs first
- then expose them as MCP tools

---

## 12) Success criteria (what “done” looks like)

An agent can reliably do this, end-to-end:
- Create property draft
- Upload a folder of photos
- Run “Remove furniture” + “Day → Twilight” on selected photos
- Save results into Gallery and set cover photo
- Generate a 4-page dossier or brochure PDF and attach it to the property
- Create a marketing listing with portals selected and a ready-to-review description
- Create follow-up tasks + schedule a visit

With:
- approvals on risky steps
- a run log you can audit
- deterministic retries (idempotency)

---

## 13) Concrete next actions (for this platform)

If you want to start building toward this in the repo:
1) Make the “source of truth” server-backed for: Properties, Contacts, Gallery media, PDF outputs.
2) Define the initial 15–25 MCP tools and map each to a platform API endpoint.
3) Implement the MCP server as a Tool Gateway with:
   - authentication
   - tenant isolation
   - structured logs + run history
   - approvals
4) Add an assistant panel UI:
   - show proposed plan
   - run steps
   - approvals
   - link results back into the platform UI

