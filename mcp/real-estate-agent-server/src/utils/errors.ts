/**
 * Error handling utilities for the MCP server
 */

import { ZodError } from "zod";

/**
 * Format an error for MCP response
 */
export function formatError(error: unknown): string {
  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => {
      const path = issue.path.join(".");
      return `- ${path}: ${issue.message}`;
    });
    return `Validation error:\n${issues.join("\n")}`;
  }

  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }

  return `Error: ${String(error)}`;
}

/**
 * Create an error response for MCP
 */
export function createErrorResponse(error: unknown): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} {
  return {
    content: [{ type: "text", text: formatError(error) }],
    isError: true,
  };
}

/**
 * Create a success response for MCP
 */
export function createSuccessResponse(text: string): {
  content: Array<{ type: "text"; text: string }>;
} {
  return {
    content: [{ type: "text", text }],
  };
}

/**
 * Handle missing table errors
 */
export function isMissingTableError(message: string): boolean {
  return typeof message === "string" && message.includes("Could not find the table");
}

/**
 * Get table setup message
 */
export function getMissingTableMessage(): string {
  return `Database tables not found. Please run the schema setup:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the schema from: supabase/schema.sql

Then retry this operation.`;
}

/**
 * Error for FAL not configured
 */
export function getFalNotConfiguredMessage(): string {
  return `FAL AI is not configured. To use AI photo features:

1. Get an API key from https://fal.ai
2. Set the FAL_KEY environment variable
3. Restart the MCP server

Example: FAL_KEY=your-api-key-here`;
}

/**
 * Error for contact not found with suggestions
 */
export function getContactNotFoundMessage(query: string, suggestions?: Array<{ first_name: string; last_name: string }>): string {
  if (suggestions && suggestions.length > 0) {
    const names = suggestions.map((c) => `"${c.first_name} ${c.last_name}"`).join(", ");
    return `Contact not found: "${query}". Did you mean: ${names}?

To create a new contact, use re_upsert_contact with the contact details.`;
  }

  return `Contact not found: "${query}".

To create a new contact, use re_upsert_contact with:
- first_name
- last_name
- type (lead, buyer, seller, investor)
- email (optional)
- phone (optional)`;
}

/**
 * Error for property not found with suggestions
 */
export function getPropertyNotFoundMessage(query: string, suggestions?: Array<{ reference: string }>): string {
  if (suggestions && suggestions.length > 0) {
    const refs = suggestions.map((p) => `"${p.reference}"`).join(", ");
    return `Property not found: "${query}". Did you mean: ${refs}?

To create a new property, use re_upsert_property or re_create_listing.`;
  }

  return `Property not found: "${query}".

To create a new property, use re_create_listing with a description, or use re_upsert_property with:
- type (house, apartment, office, retail, land)
- address (street, city, postal_code)
- price
- owner_id`;
}

/**
 * Validation error for required fields
 */
export function getRequiredFieldsMessage(fields: string[]): string {
  return `Missing required fields: ${fields.join(", ")}

Please provide all required information and try again.`;
}
