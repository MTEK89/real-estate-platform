/**
 * Fuzzy search service for contacts and properties
 */
import Fuse from "fuse.js";
import { getSupabaseClient } from "./supabase.js";
// Fuse.js configuration for contact search
const contactFuseOptions = {
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
const propertyFuseOptions = {
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
export async function fuzzySearchContacts(query, agencyId, options = {}) {
    const { type, status, limit = 10 } = options;
    const supabase = getSupabaseClient();
    // First try exact matches on common fields
    let dbQuery = supabase
        .from("contacts")
        .select("*")
        .eq("agency_id", agencyId);
    if (type)
        dbQuery = dbQuery.eq("type", type);
    if (status)
        dbQuery = dbQuery.eq("status", status);
    // Check for email or phone exact match
    const normalizedQuery = query.toLowerCase().trim();
    const isEmail = normalizedQuery.includes("@");
    const isPhone = /^[+\d\s\-()]+$/.test(normalizedQuery.replace(/\s/g, ""));
    if (isEmail) {
        const { data } = await dbQuery.ilike("email", normalizedQuery);
        if (data && data.length > 0) {
            return { contacts: data, bestMatch: data[0] };
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
            return { contacts: data, bestMatch: data[0] };
        }
    }
    // Fetch all contacts for fuzzy search (with reasonable limit)
    const { data: allContacts } = await dbQuery.order("updated_at", { ascending: false }).limit(500);
    if (!allContacts || allContacts.length === 0) {
        return { contacts: [], bestMatch: null };
    }
    // Use Fuse.js for fuzzy matching
    const fuse = new Fuse(allContacts, contactFuseOptions);
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
export async function fuzzySearchProperties(query, agencyId, options = {}) {
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
        return { properties: [exactMatch], bestMatch: exactMatch };
    }
    // Build query for fuzzy search
    let dbQuery = supabase
        .from("properties")
        .select("*")
        .eq("agency_id", agencyId);
    if (type)
        dbQuery = dbQuery.eq("type", type);
    if (status)
        dbQuery = dbQuery.eq("status", status);
    if (priceMin)
        dbQuery = dbQuery.gte("price", priceMin);
    if (priceMax)
        dbQuery = dbQuery.lte("price", priceMax);
    const { data: allProperties } = await dbQuery
        .order("updated_at", { ascending: false })
        .limit(500);
    if (!allProperties || allProperties.length === 0) {
        return { properties: [], bestMatch: null };
    }
    // Filter by city if specified (before fuzzy search)
    let propertiesToSearch = allProperties;
    if (city) {
        const cityLower = city.toLowerCase();
        propertiesToSearch = propertiesToSearch.filter((p) => p.address?.city?.toLowerCase().includes(cityLower));
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
export async function resolveContact(query, agencyId) {
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
            return { contact: data };
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
export async function resolveProperty(query, agencyId) {
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
            return { property: data };
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
export async function findDuplicateContact(agencyId, email, phone, firstName, lastName) {
    const supabase = getSupabaseClient();
    // Check by email first (strongest match)
    if (email) {
        const { data } = await supabase
            .from("contacts")
            .select("*")
            .eq("agency_id", agencyId)
            .ilike("email", email.toLowerCase().trim())
            .single();
        if (data)
            return data;
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
            if (data)
                return data;
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
    return data;
}
//# sourceMappingURL=fuzzy-search.js.map