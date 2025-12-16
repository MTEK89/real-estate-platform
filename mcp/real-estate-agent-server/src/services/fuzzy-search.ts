/**
 * Fuzzy search service for contacts and properties
 */

import Fuse, { type IFuseOptions } from "fuse.js";
import { getSupabaseClient } from "./supabase.js";
import type { Contact, Property } from "../types.js";

// Fuse.js configuration for contact search
const contactFuseOptions: IFuseOptions<Contact> = {
  keys: [
    { name: "first_name", weight: 0.4 },
    { name: "last_name", weight: 0.4 },
    { name: "email", weight: 0.15 },
    { name: "phone", weight: 0.05 },
  ],
  threshold: 0.4, // 0 = exact match, 1 = match anything
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

// Fuse.js configuration for property search
const propertyFuseOptions: IFuseOptions<Property> = {
  keys: [
    { name: "reference", weight: 0.5 },
    { name: "address.street", weight: 0.25 },
    { name: "address.city", weight: 0.15 },
    { name: "address.postal_code", weight: 0.1 },
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

/**
 * Search contacts with fuzzy matching
 */
export async function fuzzySearchContacts(
  query: string,
  agencyId: string,
  options: {
    type?: string;
    status?: string;
    limit?: number;
  } = {}
): Promise<{ contacts: Contact[]; bestMatch: Contact | null }> {
  const { type, status, limit = 10 } = options;
  const supabase = getSupabaseClient();

  // First try exact matches on common fields
  let dbQuery = supabase
    .from("contacts")
    .select("*")
    .eq("agency_id", agencyId);

  if (type) dbQuery = dbQuery.eq("type", type);
  if (status) dbQuery = dbQuery.eq("status", status);

  // Check for email or phone exact match
  const normalizedQuery = query.toLowerCase().trim();
  const isEmail = normalizedQuery.includes("@");
  const isPhone = /^[+\d\s\-()]+$/.test(normalizedQuery.replace(/\s/g, ""));

  if (isEmail) {
    const { data } = await dbQuery.ilike("email", normalizedQuery);
    if (data && data.length > 0) {
      return { contacts: data as Contact[], bestMatch: data[0] as Contact };
    }
  }

  if (isPhone) {
    const phoneDigits = normalizedQuery.replace(/\D/g, "");
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("agency_id", agencyId)
      .filter("phone", "ilike", `%${phoneDigits.slice(-8)}%`); // Match last 8 digits

    if (data && data.length > 0) {
      return { contacts: data as Contact[], bestMatch: data[0] as Contact };
    }
  }

  // Fetch all contacts for fuzzy search (with reasonable limit)
  const { data: allContacts } = await dbQuery.order("updated_at", { ascending: false }).limit(500);

  if (!allContacts || allContacts.length === 0) {
    return { contacts: [], bestMatch: null };
  }

  // Use Fuse.js for fuzzy matching
  const fuse = new Fuse(allContacts as Contact[], contactFuseOptions);
  const results = fuse.search(query, { limit });

  const contacts = results.map((r) => r.item);
  const bestMatch = contacts.length > 0 && results[0].score !== undefined && results[0].score < 0.3
    ? contacts[0]
    : null;

  return { contacts, bestMatch };
}

/**
 * Search properties with fuzzy matching
 */
export async function fuzzySearchProperties(
  query: string,
  agencyId: string,
  options: {
    type?: string;
    status?: string;
    priceMin?: number;
    priceMax?: number;
    city?: string;
    limit?: number;
  } = {}
): Promise<{ properties: Property[]; bestMatch: Property | null }> {
  const { type, status, priceMin, priceMax, city, limit = 10 } = options;
  const supabase = getSupabaseClient();

  // Check for exact reference match first
  const { data: exactMatch } = await supabase
    .from("properties")
    .select("*")
    .eq("agency_id", agencyId)
    .ilike("reference", query.trim())
    .single();

  if (exactMatch) {
    return { properties: [exactMatch as Property], bestMatch: exactMatch as Property };
  }

  // Build query for fuzzy search
  let dbQuery = supabase
    .from("properties")
    .select("*")
    .eq("agency_id", agencyId);

  if (type) dbQuery = dbQuery.eq("type", type);
  if (status) dbQuery = dbQuery.eq("status", status);
  if (priceMin) dbQuery = dbQuery.gte("price", priceMin);
  if (priceMax) dbQuery = dbQuery.lte("price", priceMax);

  const { data: allProperties } = await dbQuery
    .order("updated_at", { ascending: false })
    .limit(500);

  if (!allProperties || allProperties.length === 0) {
    return { properties: [], bestMatch: null };
  }

  // Filter by city if specified (before fuzzy search)
  let propertiesToSearch = allProperties as Property[];
  if (city) {
    const cityLower = city.toLowerCase();
    propertiesToSearch = propertiesToSearch.filter(
      (p) => p.address?.city?.toLowerCase().includes(cityLower)
    );
  }

  if (propertiesToSearch.length === 0) {
    return { properties: [], bestMatch: null };
  }

  // Use Fuse.js for fuzzy matching
  const fuse = new Fuse(propertiesToSearch, propertyFuseOptions);
  const results = fuse.search(query, { limit });

  const properties = results.map((r) => r.item);
  const bestMatch = properties.length > 0 && results[0].score !== undefined && results[0].score < 0.3
    ? properties[0]
    : null;

  return { properties, bestMatch };
}

/**
 * Find contact by ID or fuzzy search (simplified API for tools)
 */
export async function resolveContact(
  query: string,
  agencyId: string
): Promise<{ contact: Contact | null; suggestions?: Array<{ first_name: string; last_name: string }> }> {
  const supabase = getSupabaseClient();

  // Check if it looks like a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(query)) {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", query)
      .eq("agency_id", agencyId)
      .single();

    if (!error && data) {
      return { contact: data as Contact };
    }
  }

  // Try fuzzy search
  const { contacts, bestMatch } = await fuzzySearchContacts(query, agencyId);

  if (bestMatch) {
    return { contact: bestMatch };
  }

  // Return suggestions if no best match
  const suggestions = contacts.slice(0, 3).map(c => ({
    first_name: c.first_name,
    last_name: c.last_name,
  }));

  return { contact: null, suggestions: suggestions.length > 0 ? suggestions : undefined };
}

/**
 * Find property by ID, reference, or fuzzy search (simplified API for tools)
 */
export async function resolveProperty(
  query: string,
  agencyId: string
): Promise<{ property: Property | null; suggestions?: Array<{ reference: string }> }> {
  const supabase = getSupabaseClient();

  // Check if it looks like a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(query)) {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", query)
      .eq("agency_id", agencyId)
      .single();

    if (!error && data) {
      return { property: data as Property };
    }
  }

  // Try fuzzy search
  const { properties, bestMatch } = await fuzzySearchProperties(query, agencyId);

  if (bestMatch) {
    return { property: bestMatch };
  }

  // Return suggestions if no best match
  const suggestions = properties.slice(0, 3).map(p => ({
    reference: p.reference,
  }));

  return { property: null, suggestions: suggestions.length > 0 ? suggestions : undefined };
}

/**
 * Check if a contact might be a duplicate
 */
export async function findDuplicateContact(
  agencyId: string,
  email: string | undefined,
  phone: string | undefined,
  firstName: string,
  lastName: string
): Promise<Contact | null> {
  const supabase = getSupabaseClient();

  // Check by email first (strongest match)
  if (email) {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("agency_id", agencyId)
      .ilike("email", email.toLowerCase().trim())
      .single();

    if (data) return data as Contact;
  }

  // Check by phone
  if (phone) {
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length >= 8) {
      const { data } = await supabase
        .from("contacts")
        .select("*")
        .eq("agency_id", agencyId)
        .filter("phone", "ilike", `%${phoneDigits.slice(-8)}%`)
        .single();

      if (data) return data as Contact;
    }
  }

  // Check by exact name match
  const { data } = await supabase
    .from("contacts")
    .select("*")
    .eq("agency_id", agencyId)
    .ilike("first_name", firstName.trim())
    .ilike("last_name", lastName.trim())
    .single();

  return data as Contact | null;
}
