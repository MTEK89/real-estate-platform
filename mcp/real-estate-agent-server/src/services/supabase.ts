/**
 * Supabase client service for database operations
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || "";
  const key = serviceRoleKey || anonKey;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase configuration. Set SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY."
    );
  }

  supabaseInstance = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return supabaseInstance;
}

export function isServiceRole(): boolean {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

/**
 * Check if an error indicates a missing table
 */
export function isMissingTableError(message: string): boolean {
  return typeof message === "string" && message.includes("Could not find the table");
}

/**
 * Default agency ID for operations (from env or default)
 */
export function getDefaultAgencyId(): string {
  return process.env.DEFAULT_AGENCY_ID || "a1";
}

/**
 * Generate a reference number for properties
 */
export function generatePropertyReference(type: string, city: string): string {
  const prefix = city.substring(0, 3).toUpperCase() || "XXX";
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${prefix}-${year}-${random}`;
}

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

export async function queryList<T>(options: ListQueryOptions): Promise<{
  data: T[];
  count: number;
  error: Error | null;
}> {
  const {
    table,
    agencyId,
    limit = 50,
    offset = 0,
    orderBy = "created_at",
    orderDirection = "desc",
    filters = {},
    search,
  } = options;

  const supabase = getSupabaseClient();

  let query = supabase
    .from(table)
    .select("*", { count: "exact" })
    .eq("agency_id", agencyId);

  // Apply filters
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
  }

  // Apply search (simple OR search across columns)
  if (search && search.query) {
    const searchConditions = search.columns
      .map((col) => `${col}.ilike.%${search.query}%`)
      .join(",");
    query = query.or(searchConditions);
  }

  // Apply ordering and pagination
  query = query
    .order(orderBy, { ascending: orderDirection === "asc" })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return { data: [], count: 0, error: new Error(error.message) };
  }

  return { data: (data as T[]) || [], count: count || 0, error: null };
}

/**
 * Get a single record by ID
 */
export async function getById<T>(
  table: string,
  id: string,
  agencyId: string
): Promise<{ data: T | null; error: Error | null }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .eq("agency_id", agencyId)
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as T, error: null };
}

/**
 * Insert a new record
 */
export async function insertRecord<T>(
  table: string,
  record: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from(table)
    .insert(record)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as T, error: null };
}

/**
 * Update a record
 */
export async function updateRecord<T>(
  table: string,
  id: string,
  agencyId: string,
  updates: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", id)
    .eq("agency_id", agencyId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as T, error: null };
}

/**
 * Delete a record
 */
export async function deleteRecord(
  table: string,
  id: string,
  agencyId: string
): Promise<{ success: boolean; error: Error | null }> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("agency_id", agencyId);

  if (error) {
    return { success: false, error: new Error(error.message) };
  }

  return { success: true, error: null };
}

/**
 * Upsert (insert or update) based on unique fields
 */
export async function upsertRecord<T>(
  table: string,
  record: Record<string, unknown>,
  onConflict: string
): Promise<{ data: T | null; error: Error | null; isNew: boolean }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from(table)
    .upsert(record, { onConflict })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: new Error(error.message), isNew: false };
  }

  // Check if it was an insert or update (simplified check)
  const isNew = !record.id;

  return { data: data as T, error: null, isNew };
}
