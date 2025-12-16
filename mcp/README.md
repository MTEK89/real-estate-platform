# Supabase MCP (Setup)

This repo uses Supabase for data. Supabase also provides a hosted **MCP server** that lets an AI “host” (Claude Desktop, Cursor, etc.) interact with your Supabase project via tools/resources.

## 1) Enable / get credentials

You need:
- `SUPABASE_URL`
- An auth mechanism for the MCP host to access your Supabase account/project (OAuth or a token, depending on the MCP host you use).

Keep tokens out of git.

## 2) Connect your MCP host

Supabase MCP is hosted (HTTP) at:

```txt
https://mcp.supabase.com/mcp
```

Different MCP hosts have slightly different configuration formats, but they all need:
- a server name (e.g. `supabase`)
- the MCP URL above
- authentication

### Example (generic – adjust to your MCP host)

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```

If your MCP host supports adding headers, you’ll typically set an `Authorization` header there (exact token type depends on Supabase MCP auth mode and your MCP host).

## 2b) Local MCP server for this repo (recommended for now)

This repo also ships a **local MCP server** that talks to your Supabase project using `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

1) Create `./.env.local`:

```bash
SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
SUPABASE_ANON_KEY="YOUR_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

2) Run the MCP server:

```bash
npm run mcp:supabase
```

To verify it end-to-end from this repo (lists tools, calls `contacts.list`):

```bash
npm run mcp:smoke
```

3) In your MCP host, add an MCP server that runs this command (stdio):

```json
{
  "mcpServers": {
    "real-estate-supabase-admin": {
      "command": "npm",
      "args": ["run", "mcp:supabase"],
      "cwd": "/ABSOLUTE/PATH/TO/real-estate-platform-3"
    }
  }
}
```

This exposes a small set of tools like:
- `contacts.list/create/update/delete`
- `properties.list/create/update/delete`
- `tasks.list/create/update/delete`

## 3) Recommended safety defaults

When you connect an AI agent to Supabase MCP:
- Prefer **read-only** access for demos.
- Require **human approval** for destructive ops (delete/update/DDL).
- Avoid granting access to production projects initially; start with a staging project.
- Keep a strict allowlist of which MCP servers are enabled on your machine.

## 4) How we plan to use it in this platform

We do **not** embed MCP directly into the Next.js runtime yet. The intended flow is:
- The platform exposes stable APIs (`/api/v1/*`) and background jobs.
- An external MCP host (or internal “agent service” later) connects to Supabase MCP and/or our own future “Platform MCP Gateway”.

See:
- `MCP_AGENT_ROADMAP.md`
- `SECURITY_BASELINE_V1.md`
