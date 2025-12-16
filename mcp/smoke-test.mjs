import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Put it in .env.local.`);
  return value;
}

async function main() {
  // Ensure env exists before spawning the server (server will also validate).
  requireEnv("SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    requireEnv("SUPABASE_ANON_KEY");
  }

  const client = new Client({ name: "mcp-smoke", version: "0.1.0" });
  const transport = new StdioClientTransport({
    command: "node",
    args: ["mcp/supabase-tools-server.mjs"],
    cwd: process.cwd(),
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    },
    stderr: "pipe",
  });

  transport.stderr?.on("data", (chunk) => {
    // MCP protocol uses stdout; server logs go to stderr.
    process.stderr.write(chunk);
  });

  await client.connect(transport);

  const tools = await client.listTools();
  console.log("TOOLS:");
  console.log(tools.tools.map((t) => t.name).sort().join("\n"));

  // Try a small read call (safe).
  const res = await client.callTool({
    name: "contacts.list",
    arguments: { agencyId: "a1", limit: 3 },
  });

  console.log("\ncontacts.list result:");
  console.log(JSON.stringify(res, null, 2));
  if (res.isError) {
    console.log(
      "\nHint: If you see 'Could not find the table', run `supabase/schema.sql` in Supabase SQL Editor for this project.",
    );
  }

  await client.close();
}

main().catch((err) => {
  console.error("MCP smoke test failed:", err?.message || err);
  process.exit(1);
});
