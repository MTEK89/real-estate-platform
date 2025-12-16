/**
 * Supabase client service for database operations
 */
import { SupabaseClient } from "@supabase/supabase-js";
export declare function getSupabaseClient(): SupabaseClient;
export declare function isServiceRole(): boolean;
/**
 * Check if an error indicates a missing table
 */
export declare function isMissingTableError(message: string): boolean;
/**
 * Default agency ID for operations (from env or default)
 */
export declare function getDefaultAgencyId(): string;
/**
 * Generate a reference number for properties
 */
export declare function generatePropertyReference(type: string, city: string): string;
/**
 * Generic query builder for list operations with filtering
 */
export interface ListQueryOptions {
    table: string;
    agencyId: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: "asc" | "desc";
    filters?: Record<string, unknown>;
    search?: {
        columns: string[];
        query: string;
    };
}
export declare function queryList<T>(options: ListQueryOptions): Promise<{
    data: T[];
    count: number;
    error: Error | null;
}>;
/**
 * Get a single record by ID
 */
export declare function getById<T>(table: string, id: string, agencyId: string): Promise<{
    data: T | null;
    error: Error | null;
}>;
/**
 * Insert a new record
 */
export declare function insertRecord<T>(table: string, record: Record<string, unknown>): Promise<{
    data: T | null;
    error: Error | null;
}>;
/**
 * Update a record
 */
export declare function updateRecord<T>(table: string, id: string, agencyId: string, updates: Record<string, unknown>): Promise<{
    data: T | null;
    error: Error | null;
}>;
/**
 * Delete a record
 */
export declare function deleteRecord(table: string, id: string, agencyId: string): Promise<{
    success: boolean;
    error: Error | null;
}>;
/**
 * Upsert (insert or update) based on unique fields
 */
export declare function upsertRecord<T>(table: string, record: Record<string, unknown>, onConflict: string): Promise<{
    data: T | null;
    error: Error | null;
    isNew: boolean;
}>;
//# sourceMappingURL=supabase.d.ts.map