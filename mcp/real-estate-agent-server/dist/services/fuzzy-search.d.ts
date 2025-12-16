/**
 * Fuzzy search service for contacts and properties
 */
import type { Contact, Property } from "../types.js";
/**
 * Search contacts with fuzzy matching
 */
export declare function fuzzySearchContacts(query: string, agencyId: string, options?: {
    type?: string;
    status?: string;
    limit?: number;
}): Promise<{
    contacts: Contact[];
    bestMatch: Contact | null;
}>;
/**
 * Search properties with fuzzy matching
 */
export declare function fuzzySearchProperties(query: string, agencyId: string, options?: {
    type?: string;
    status?: string;
    priceMin?: number;
    priceMax?: number;
    city?: string;
    limit?: number;
}): Promise<{
    properties: Property[];
    bestMatch: Property | null;
}>;
/**
 * Find contact by ID or fuzzy search (simplified API for tools)
 */
export declare function resolveContact(query: string, agencyId: string): Promise<{
    contact: Contact | null;
    suggestions?: Array<{
        first_name: string;
        last_name: string;
    }>;
}>;
/**
 * Find property by ID, reference, or fuzzy search (simplified API for tools)
 */
export declare function resolveProperty(query: string, agencyId: string): Promise<{
    property: Property | null;
    suggestions?: Array<{
        reference: string;
    }>;
}>;
/**
 * Check if a contact might be a duplicate
 */
export declare function findDuplicateContact(agencyId: string, email: string | undefined, phone: string | undefined, firstName: string, lastName: string): Promise<Contact | null>;
//# sourceMappingURL=fuzzy-search.d.ts.map