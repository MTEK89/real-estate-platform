/**
 * Response formatting utilities
 */

import { CHARACTER_LIMIT } from "../constants.js";
import type {
  ResponseFormat,
  Contact,
  Property,
  Visit,
  Task,
  Contract,
  DashboardData,
  LeadScore,
  FollowUpSuggestion,
  PaginatedResponse,
} from "../types.js";

/**
 * Format a response based on the requested format
 */
export function formatResponse<T>(
  data: T,
  format: ResponseFormat,
  markdownFormatter: (data: T) => string
): string {
  if (format === "json") {
    return JSON.stringify(data, null, 2);
  }
  return markdownFormatter(data);
}

/**
 * Truncate response if it exceeds the character limit
 */
export function truncateResponse(
  response: string,
  additionalInfo?: string
): { response: string; truncated: boolean } {
  if (response.length <= CHARACTER_LIMIT) {
    return { response, truncated: false };
  }

  const truncationNote = "\n\n---\n⚠️ *Response truncated due to length. Use filters or pagination to see more results.*";

  const truncated = response.substring(0, CHARACTER_LIMIT - truncationNote.length - 100) + truncationNote;

  if (additionalInfo) {
    return { response: truncated + "\n\n" + additionalInfo, truncated: true };
  }

  return { response: truncated, truncated: true };
}

// ============================================
// Contact Formatters
// ============================================

export function formatContact(
  contact: Contact,
  options?: { detailed?: boolean } | boolean
): string {
  const detailed = typeof options === "boolean" ? options : options?.detailed ?? false;
  const name = `${contact.first_name} ${contact.last_name}`;
  const typeEmoji = getContactTypeEmoji(contact.type);
  const statusEmoji = getContactStatusEmoji(contact.status);

  if (!detailed) {
    return `${typeEmoji} **${name}** (${contact.type}) ${statusEmoji} ${contact.status}`;
  }

  const lines = [
    `## ${typeEmoji} ${name}`,
    `- **Type**: ${contact.type}`,
    `- **Status**: ${statusEmoji} ${contact.status}`,
  ];

  if (contact.email) lines.push(`- **Email**: ${contact.email}`);
  if (contact.phone) lines.push(`- **Phone**: ${contact.phone}`);
  if (contact.source) lines.push(`- **Source**: ${contact.source}`);
  if (contact.tags.length > 0) lines.push(`- **Tags**: ${contact.tags.join(", ")}`);
  if (contact.notes) lines.push(`- **Notes**: ${contact.notes}`);
  lines.push(`- **ID**: \`${contact.id}\``);

  return lines.join("\n");
}

export function formatContactList(
  contacts: Contact[],
  options?: { total?: number; offset?: number; limit?: number } | boolean
): string {
  if (contacts.length === 0) {
    return "No contacts found.";
  }

  const lines: string[] = [];
  const pagination = typeof options === "object" ? options : undefined;

  if (pagination) {
    lines.push(`Showing ${contacts.length} of ${pagination.total || contacts.length} contacts`);
    if (pagination.total && pagination.offset !== undefined && pagination.limit && pagination.total > pagination.offset + pagination.limit) {
      lines.push(`(Use offset=${pagination.offset + pagination.limit} to see more)`);
    }
    lines.push("");
  }

  lines.push("| Type | Name | Status | Email | Phone |");
  lines.push("|------|------|--------|-------|-------|");

  for (const contact of contacts) {
    const typeEmoji = getContactTypeEmoji(contact.type);
    const statusEmoji = getContactStatusEmoji(contact.status);
    lines.push(
      `| ${typeEmoji} ${contact.type} | ${contact.first_name} ${contact.last_name} | ${statusEmoji} ${contact.status} | ${contact.email || "-"} | ${contact.phone || "-"} |`
    );
  }

  return lines.join("\n");
}

function getContactTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    lead: "🔵",
    buyer: "🟢",
    seller: "🟡",
    investor: "💰",
  };
  return emojis[type] || "👤";
}

function getContactStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    new: "🆕",
    contacted: "📞",
    qualified: "✅",
    nurturing: "🌱",
    closed: "🏁",
  };
  return emojis[status] || "⚪";
}

// ============================================
// Property Formatters
// ============================================

export function formatProperty(
  property: Property,
  options?: { detailed?: boolean } | boolean
): string {
  const detailed = typeof options === "boolean" ? options : options?.detailed ?? false;
  const address = formatAddress(property.address);
  const typeEmoji = getPropertyTypeEmoji(property.type);
  const statusEmoji = getPropertyStatusEmoji(property.status);
  const priceFormatted = formatPrice(property.price);

  if (!detailed) {
    return `${typeEmoji} **${property.reference}** - ${address} | ${priceFormatted} ${statusEmoji}`;
  }

  const lines = [
    `## ${typeEmoji} ${property.reference}`,
    `- **Address**: ${address}`,
    `- **Type**: ${property.type}`,
    `- **Status**: ${statusEmoji} ${property.status}`,
    `- **Price**: ${priceFormatted}`,
  ];

  const chars = property.characteristics;
  if (chars.surface) lines.push(`- **Surface**: ${chars.surface} m²`);
  if (chars.rooms) lines.push(`- **Rooms**: ${chars.rooms}`);
  if (chars.bedrooms) lines.push(`- **Bedrooms**: ${chars.bedrooms}`);
  if (chars.bathrooms) lines.push(`- **Bathrooms**: ${chars.bathrooms}`);
  if (chars.year_built) lines.push(`- **Year Built**: ${chars.year_built}`);

  if (property.tags.length > 0) lines.push(`- **Tags**: ${property.tags.join(", ")}`);
  if (property.images.length > 0) lines.push(`- **Images**: ${property.images.length} photos`);
  lines.push(`- **ID**: \`${property.id}\``);

  return lines.join("\n");
}

export function formatPropertyList(
  properties: Property[],
  options?: { total?: number; offset?: number; limit?: number } | boolean
): string {
  if (properties.length === 0) {
    return "No properties found.";
  }

  const lines: string[] = [];
  const pagination = typeof options === "object" ? options : undefined;

  if (pagination) {
    lines.push(`Showing ${properties.length} of ${pagination.total || properties.length} properties`);
    if (pagination.total && pagination.offset !== undefined && pagination.limit && pagination.total > pagination.offset + pagination.limit) {
      lines.push(`(Use offset=${pagination.offset + pagination.limit} to see more)`);
    }
    lines.push("");
  }

  lines.push("| Ref | Type | Address | Price | Status |");
  lines.push("|-----|------|---------|-------|--------|");

  for (const property of properties) {
    const typeEmoji = getPropertyTypeEmoji(property.type);
    const statusEmoji = getPropertyStatusEmoji(property.status);
    const address = formatAddressShort(property.address);
    lines.push(
      `| ${property.reference} | ${typeEmoji} ${property.type} | ${address} | ${formatPrice(property.price)} | ${statusEmoji} ${property.status} |`
    );
  }

  return lines.join("\n");
}

function getPropertyTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    house: "🏠",
    apartment: "🏢",
    office: "🏛️",
    retail: "🏪",
    land: "🌍",
  };
  return emojis[type] || "🏗️";
}

function getPropertyStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    draft: "📝",
    published: "🟢",
    under_offer: "🟡",
    sold: "✅",
    rented: "🔑",
    archived: "📦",
  };
  return emojis[status] || "⚪";
}

// ============================================
// Visit Formatters
// ============================================

export function formatVisit(
  visit: Visit,
  options?: { property?: Property; contact?: Contact; detailed?: boolean }
): string {
  const property = options?.property;
  const contact = options?.contact;
  const statusEmoji = getVisitStatusEmoji(visit.status);
  const confirmEmoji = visit.confirmation_status === "confirmed" ? "✅" : visit.confirmation_status === "declined" ? "❌" : "⏳";

  const lines = [
    `## 🗓️ Visit on ${visit.date}`,
    `- **Time**: ${visit.start_time} - ${visit.end_time}`,
    `- **Status**: ${statusEmoji} ${visit.status} (${confirmEmoji} ${visit.confirmation_status})`,
  ];

  if (property) {
    lines.push(`- **Property**: ${property.reference} - ${formatAddressShort(property.address)}`);
  } else {
    lines.push(`- **Property ID**: \`${visit.property_id}\``);
  }

  if (contact) {
    lines.push(`- **Contact**: ${contact.first_name} ${contact.last_name}`);
  } else {
    lines.push(`- **Contact ID**: \`${visit.contact_id}\``);
  }

  if (visit.notes) lines.push(`- **Notes**: ${visit.notes}`);
  if (visit.feedback) {
    lines.push(`- **Feedback**: Interest ${visit.feedback.interest_level}/5 - ${visit.feedback.comments || "No comments"}`);
  }

  lines.push(`- **ID**: \`${visit.id}\``);

  return lines.join("\n");
}

export function formatVisitTable(
  visits: Array<{ visit: Visit; property?: Property; contact?: Contact }>
): string {
  if (visits.length === 0) {
    return "No visits scheduled.";
  }

  const lines = [
    "| Time | Property | Client | Status |",
    "|------|----------|--------|--------|",
  ];

  for (const { visit, property, contact } of visits) {
    const statusEmoji = getVisitStatusEmoji(visit.status);
    const confirmEmoji = visit.confirmation_status === "confirmed" ? "✅" : "⏳";
    const propertyRef = property?.reference || visit.property_id;
    const contactName = contact ? `${contact.first_name} ${contact.last_name}` : visit.contact_id;

    lines.push(
      `| ${visit.start_time} | ${propertyRef} | ${contactName} | ${statusEmoji} ${confirmEmoji} |`
    );
  }

  return lines.join("\n");
}

function getVisitStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    scheduled: "📅",
    confirmed: "✅",
    completed: "🏁",
    cancelled: "❌",
  };
  return emojis[status] || "⚪";
}

// ============================================
// Task Formatters
// ============================================

export function formatTask(
  task: Task,
  options?: { detailed?: boolean }
): string {
  const priorityEmoji = getTaskPriorityEmoji(task.priority);
  const statusEmoji = getTaskStatusEmoji(task.status);
  const isOverdue = task.status !== "completed" && new Date(task.due_date) < new Date();
  const overdueMarker = isOverdue ? " ⚠️ OVERDUE" : "";

  const lines = [
    `## ${priorityEmoji} ${task.title}${overdueMarker}`,
    `- **Status**: ${statusEmoji} ${task.status}`,
    `- **Priority**: ${task.priority}`,
    `- **Due**: ${task.due_date}`,
  ];

  if (task.description) lines.push(`- **Description**: ${task.description}`);
  if (task.related_to) {
    lines.push(`- **Related to**: ${task.related_to.type} (\`${task.related_to.id}\`)`);
  }
  lines.push(`- **ID**: \`${task.id}\``);

  return lines.join("\n");
}

export function formatTaskList(
  tasks: Task[],
  options?: { total?: number; offset?: number; limit?: number }
): string {
  if (tasks.length === 0) {
    return "No tasks found.";
  }

  const lines: string[] = [];

  if (options) {
    lines.push(`Showing ${tasks.length} of ${options.total || tasks.length} tasks`);
    if (options.total && options.offset !== undefined && options.limit && options.total > options.offset + options.limit) {
      lines.push(`(Use offset=${options.offset + options.limit} to see more)`);
    }
    lines.push("");
  }

  for (const task of tasks) {
    const priorityEmoji = getTaskPriorityEmoji(task.priority);
    const isOverdue = task.status !== "completed" && new Date(task.due_date) < new Date();
    const overdueMarker = isOverdue ? "⚠️ " : "";
    lines.push(`- ${overdueMarker}${priorityEmoji} **${task.title}** (due: ${task.due_date})`);
  }

  return lines.join("\n");
}

function getTaskPriorityEmoji(priority: string): string {
  const emojis: Record<string, string> = {
    low: "🟢",
    medium: "🟡",
    high: "🟠",
    urgent: "🔴",
  };
  return emojis[priority] || "⚪";
}

function getTaskStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    todo: "📋",
    in_progress: "🔄",
    completed: "✅",
    cancelled: "❌",
  };
  return emojis[status] || "⚪";
}

// ============================================
// Dashboard Formatter
// ============================================

export function formatDashboard(data: DashboardData): string {
  const lines = [`# Dashboard - ${data.date}`, ""];

  // Visits
  lines.push(`## Today's Visits (${data.visits.length})`);
  if (data.visits.length === 0) {
    lines.push("No visits scheduled for today.");
  } else {
    lines.push("| Time | Property | Client | Status |");
    lines.push("|------|----------|--------|--------|");
    for (const visit of data.visits) {
      const statusEmoji = getVisitStatusEmoji(visit.status);
      const confirmEmoji = visit.confirmation_status === "confirmed" ? "✅" : "⏳";
      lines.push(`| ${visit.time} | ${visit.property_reference} ${visit.property_address} | ${visit.contact_name} | ${statusEmoji} ${confirmEmoji} |`);
    }
  }
  lines.push("");

  // Urgent Tasks
  if (data.urgent_tasks.length > 0 || data.overdue_tasks.length > 0) {
    lines.push(`## Urgent Tasks (${data.urgent_tasks.length + data.overdue_tasks.length})`);

    for (const task of data.overdue_tasks) {
      lines.push(`- ⚠️ **OVERDUE**: ${task.title} (due ${task.due_date})`);
    }
    for (const task of data.urgent_tasks) {
      const emoji = getTaskPriorityEmoji(task.priority);
      lines.push(`- ${emoji} ${task.title} (due ${task.due_date})`);
    }
    lines.push("");
  }

  // Pipeline Summary
  lines.push("## Pipeline Summary");
  lines.push(`- 🔵 New Leads: ${data.pipeline_summary.new_leads}`);
  lines.push(`- 📞 Contacted: ${data.pipeline_summary.contacted}`);
  lines.push(`- ✅ Qualified: ${data.pipeline_summary.qualified}`);
  lines.push(`- 🌱 Nurturing: ${data.pipeline_summary.nurturing}`);
  lines.push(`- 🏁 Closed: ${data.pipeline_summary.closed}`);

  return lines.join("\n");
}

// ============================================
// Utility Formatters
// ============================================

export function formatAddress(address: Property["address"]): string {
  if (!address) return "No address";
  const parts = [address.street, address.city, address.postal_code, address.country].filter(Boolean);
  return parts.join(", ") || "No address";
}

export function formatAddressShort(address: Property["address"]): string {
  if (!address) return "No address";
  const parts = [address.street, address.city].filter(Boolean);
  return parts.join(", ") || "No address";
}

export function formatPrice(price: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-LU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Format a paginated response
 */
export function formatPaginatedResponse<T>(
  response: PaginatedResponse<T>,
  itemFormatter: (item: T) => string
): string {
  const lines: string[] = [];

  lines.push(`Showing ${response.count} of ${response.total} results`);
  if (response.has_more) {
    lines.push(`(Use offset=${response.next_offset} to see more)`);
  }
  lines.push("");

  for (const item of response.items) {
    lines.push(itemFormatter(item));
    lines.push("");
  }

  return lines.join("\n");
}

// ============================================
// Visit List Formatter
// ============================================

export function formatVisitList(
  visits: Array<{ visit: Visit; property?: Property; contact?: Contact }>,
  pagination?: { total: number; offset: number; limit: number }
): string {
  if (visits.length === 0) {
    return "No visits found.";
  }

  const lines: string[] = [];

  if (pagination) {
    lines.push(`Showing ${visits.length} of ${pagination.total} visits`);
    if (pagination.total > pagination.offset + pagination.limit) {
      lines.push(`(Use offset=${pagination.offset + pagination.limit} to see more)`);
    }
    lines.push("");
  }

  lines.push("| Date | Time | Property | Client | Status |");
  lines.push("|------|------|----------|--------|--------|");

  for (const { visit, property, contact } of visits) {
    const statusEmoji = getVisitStatusEmoji(visit.status);
    const confirmEmoji = visit.confirmation_status === "confirmed" ? "✅" : "⏳";
    const propertyRef = property?.reference || visit.property_id;
    const contactName = contact ? `${contact.first_name} ${contact.last_name}` : visit.contact_id;

    lines.push(
      `| ${visit.date} | ${visit.start_time} | ${propertyRef} | ${contactName} | ${statusEmoji} ${confirmEmoji} |`
    );
  }

  return lines.join("\n");
}

// ============================================
// Contract Formatters
// ============================================

export function formatContract(
  contract: Contract,
  options?: { property?: Property; contact?: Contact; detailed?: boolean }
): string {
  const typeEmoji = getContractTypeEmoji(contract.type);
  const statusEmoji = getContractStatusEmoji(contract.status);

  if (!options?.detailed) {
    return `${typeEmoji} **${contract.type}** - ${statusEmoji} ${contract.status}`;
  }

  const lines = [
    `## ${typeEmoji} ${contract.type.charAt(0).toUpperCase() + contract.type.slice(1)} Contract`,
    `- **Status**: ${statusEmoji} ${contract.status}`,
    `- **Category**: ${contract.property_category || "N/A"}`,
    `- **Signature Method**: ${contract.signature_method}`,
  ];

  if (options?.property) {
    lines.push(`- **Property**: ${options.property.reference} - ${formatAddressShort(options.property.address)}`);
  } else {
    lines.push(`- **Property ID**: \`${contract.property_id}\``);
  }

  if (options?.contact) {
    lines.push(`- **Contact**: ${options.contact.first_name} ${options.contact.last_name}`);
  } else {
    lines.push(`- **Contact ID**: \`${contract.contact_id}\``);
  }

  if (contract.signed_at) lines.push(`- **Signed**: ${contract.signed_at.split("T")[0]}`);
  if (contract.expires_at) lines.push(`- **Expires**: ${contract.expires_at.split("T")[0]}`);
  if (contract.file_url) lines.push(`- **File**: [View Document](${contract.file_url})`);

  lines.push(`- **ID**: \`${contract.id}\``);

  return lines.join("\n");
}

export function formatContractList(
  contracts: Array<{ contract: Contract; property?: Property; contact?: Contact }>,
  pagination?: { total: number; offset: number; limit: number }
): string {
  if (contracts.length === 0) {
    return "No contracts found.";
  }

  const lines: string[] = [];

  if (pagination) {
    lines.push(`Showing ${contracts.length} of ${pagination.total} contracts`);
    if (pagination.total > pagination.offset + pagination.limit) {
      lines.push(`(Use offset=${pagination.offset + pagination.limit} to see more)`);
    }
    lines.push("");
  }

  lines.push("| Type | Property | Contact | Status |");
  lines.push("|------|----------|---------|--------|");

  for (const { contract, property, contact } of contracts) {
    const typeEmoji = getContractTypeEmoji(contract.type);
    const statusEmoji = getContractStatusEmoji(contract.status);
    const propertyRef = property?.reference || contract.property_id?.substring(0, 8) || "N/A";
    const contactName = contact ? `${contact.first_name} ${contact.last_name}` : (contract.contact_id?.substring(0, 8) || "N/A");

    lines.push(
      `| ${typeEmoji} ${contract.type} | ${propertyRef} | ${contactName} | ${statusEmoji} ${contract.status} |`
    );
  }

  return lines.join("\n");
}

function getContractTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    mandate: "📋",
    sale: "🏷️",
    rental: "🔑",
  };
  return emojis[type] || "📄";
}

function getContractStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    draft: "📝",
    pending: "⏳",
    active: "🟢",
    signed: "✅",
    completed: "🏁",
    cancelled: "❌",
    expired: "⚠️",
  };
  return emojis[status] || "⚪";
}
