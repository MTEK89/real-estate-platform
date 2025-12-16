/**
 * Error handling utilities for the MCP server
 */
/**
 * Format an error for MCP response
 */
export declare function formatError(error: unknown): string;
/**
 * Create an error response for MCP
 */
export declare function createErrorResponse(error: unknown): {
    content: Array<{
        type: "text";
        text: string;
    }>;
    isError: true;
};
/**
 * Create a success response for MCP
 */
export declare function createSuccessResponse(text: string): {
    content: Array<{
        type: "text";
        text: string;
    }>;
};
/**
 * Handle missing table errors
 */
export declare function isMissingTableError(message: string): boolean;
/**
 * Get table setup message
 */
export declare function getMissingTableMessage(): string;
/**
 * Error for FAL not configured
 */
export declare function getFalNotConfiguredMessage(): string;
/**
 * Error for contact not found with suggestions
 */
export declare function getContactNotFoundMessage(query: string, suggestions?: Array<{
    first_name: string;
    last_name: string;
}>): string;
/**
 * Error for property not found with suggestions
 */
export declare function getPropertyNotFoundMessage(query: string, suggestions?: Array<{
    reference: string;
}>): string;
/**
 * Validation error for required fields
 */
export declare function getRequiredFieldsMessage(fields: string[]): string;
//# sourceMappingURL=errors.d.ts.map