/**
 * Response formatting utilities
 */
import type { ResponseFormat, Contact, Property, Visit, Task, Contract, DashboardData, PaginatedResponse } from "../types.js";
/**
 * Format a response based on the requested format
 */
export declare function formatResponse<T>(data: T, format: ResponseFormat, markdownFormatter: (data: T) => string): string;
/**
 * Truncate response if it exceeds the character limit
 */
export declare function truncateResponse(response: string, additionalInfo?: string): {
    response: string;
    truncated: boolean;
};
export declare function formatContact(contact: Contact, options?: {
    detailed?: boolean;
} | boolean): string;
export declare function formatContactList(contacts: Contact[], options?: {
    total?: number;
    offset?: number;
    limit?: number;
} | boolean): string;
export declare function formatProperty(property: Property, options?: {
    detailed?: boolean;
} | boolean): string;
export declare function formatPropertyList(properties: Property[], options?: {
    total?: number;
    offset?: number;
    limit?: number;
} | boolean): string;
export declare function formatVisit(visit: Visit, options?: {
    property?: Property;
    contact?: Contact;
    detailed?: boolean;
}): string;
export declare function formatVisitTable(visits: Array<{
    visit: Visit;
    property?: Property;
    contact?: Contact;
}>): string;
export declare function formatTask(task: Task, options?: {
    detailed?: boolean;
}): string;
export declare function formatTaskList(tasks: Task[], options?: {
    total?: number;
    offset?: number;
    limit?: number;
}): string;
export declare function formatDashboard(data: DashboardData): string;
export declare function formatAddress(address: Property["address"]): string;
export declare function formatAddressShort(address: Property["address"]): string;
export declare function formatPrice(price: number, currency?: string): string;
/**
 * Format a paginated response
 */
export declare function formatPaginatedResponse<T>(response: PaginatedResponse<T>, itemFormatter: (item: T) => string): string;
export declare function formatVisitList(visits: Array<{
    visit: Visit;
    property?: Property;
    contact?: Contact;
}>, pagination?: {
    total: number;
    offset: number;
    limit: number;
}): string;
export declare function formatContract(contract: Contract, options?: {
    property?: Property;
    contact?: Contact;
    detailed?: boolean;
}): string;
export declare function formatContractList(contracts: Array<{
    contract: Contract;
    property?: Property;
    contact?: Contact;
}>, pagination?: {
    total: number;
    offset: number;
    limit: number;
}): string;
//# sourceMappingURL=formatters.d.ts.map