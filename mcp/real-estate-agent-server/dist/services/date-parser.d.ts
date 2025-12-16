/**
 * Natural language date parsing service
 */
/**
 * Parse a natural language date/time string
 */
export declare function parseNaturalDate(input: string, referenceDate?: Date): {
    date: Date | null;
    dateString: string | null;
    timeString: string | null;
    isAllDay: boolean;
};
/**
 * Parse date and time separately
 */
export declare function parseDateAndTime(dateInput: string, timeInput?: string, referenceDate?: Date): {
    date: Date | null;
    dateString: string | null;
    timeString: string | null;
    error: string | null;
};
/**
 * Format a Date to YYYY-MM-DD
 */
export declare function formatDateString(date: Date): string;
/**
 * Format a Date to HH:MM
 */
export declare function formatTimeString(date: Date): string;
/**
 * Calculate end time given start time and duration
 */
export declare function calculateEndTime(startTime: string, durationMinutes: number): string;
/**
 * Format a date for display
 */
export declare function formatDisplayDate(date: Date | string): string;
/**
 * Check if a date is today
 */
export declare function isToday(date: Date | string): boolean;
/**
 * Check if a date is in the past
 */
export declare function isPast(date: Date | string): boolean;
/**
 * Get relative date description
 */
export declare function getRelativeDate(date: Date | string): string;
/**
 * Parse a date string and return YYYY-MM-DD format (alias for parseNaturalDate)
 */
export declare function parseDate(input: string): string | null;
/**
 * Format time string to HH:MM (alias for formatTimeString with string input)
 */
export declare function formatTime(input: string): string;
/**
 * Add minutes to a time string (alias for calculateEndTime)
 */
export declare function addMinutes(startTime: string, minutes: number): string;
/**
 * Format date for display (alias for formatDisplayDate)
 */
export declare function formatDateDisplay(date: string): string;
/**
 * Check if date is in the past (alias for isPast)
 */
export declare function isPastDate(date: string): boolean;
//# sourceMappingURL=date-parser.d.ts.map