#!/usr/bin/env node
/**
 * Real Estate Agent MCP Server
 *
 * A comprehensive MCP server for real estate agents that enables natural language
 * interactions with their CRM, property management, and AI photo editing tools.
 *
 * Usage:
 *   npx real-estate-agent-mcp-server
 *
 * Environment Variables:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_KEY - Supabase service role key (for RLS bypass)
 *   FAL_KEY - FAL AI API key (for AI photo features)
 *   AGENCY_ID - Default agency ID (optional, defaults to "a1")
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Entity tools
import {
  registerContactTools,
  registerPropertyTools,
  registerVisitTools,
  registerTaskTools,
  registerContractTools,
} from "./tools/entities/index.js";

// Workflow tools
import {
  registerDashboardTools,
  registerCreateListingTools,
  registerScheduleVisitTools,
  registerPrepareContractTools,
  registerDraftEmailTools,
} from "./tools/workflows/index.js";

// AI Photo tools
import {
  registerVirtualStagingTools,
  registerHeadshotTools,
  registerPhotoEditTools,
} from "./tools/ai-photo/index.js";

/**
 * Server information
 */
const SERVER_NAME = "real-estate-agent-mcp-server";
const SERVER_VERSION = "1.0.0";

/**
 * Initialize and start the MCP server
 */
async function main(): Promise<void> {
  // Create the MCP server
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Register all tools
  console.error(`[${SERVER_NAME}] Registering tools...`);

  // Entity Management Tools (CRUD operations)
  registerContactTools(server);
  registerPropertyTools(server);
  registerVisitTools(server);
  registerTaskTools(server);
  registerContractTools(server);

  // Workflow Tools (High-level operations)
  registerDashboardTools(server);
  registerCreateListingTools(server);
  registerScheduleVisitTools(server);
  registerPrepareContractTools(server);
  registerDraftEmailTools(server);

  // AI Photo Tools
  registerVirtualStagingTools(server);
  registerHeadshotTools(server);
  registerPhotoEditTools(server);

  console.error(`[${SERVER_NAME}] Tools registered successfully`);

  // Connect to transport
  const transport = new StdioServerTransport();

  console.error(`[${SERVER_NAME}] Starting server v${SERVER_VERSION}...`);

  await server.connect(transport);

  console.error(`[${SERVER_NAME}] Server running on stdio`);
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.error(`[${SERVER_NAME}] Shutting down...`);
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.error(`[${SERVER_NAME}] Shutting down...`);
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error(`[${SERVER_NAME}] Fatal error:`, error);
  process.exit(1);
});
