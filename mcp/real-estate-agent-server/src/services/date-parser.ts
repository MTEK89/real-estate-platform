/**
 * Natural language date parsing service
 */

import * as chrono from "chrono-node";

/**
 * Parse a natural language date/time string
 */
export function parseNaturalDate(
  input: string,
  referenceDate?: Date
): {
  date: Date | null;
  dateString: string | null;
  timeString: string | null;
  isAllDay: boolean;
} {
  const ref = referenceDate || new Date();

  const results = chrono.parse(input, ref, { forwardDate: true });

  if (results.length === 0) {
    // Try to parse as ISO date
    const isoDate = new Date(input);
    if (!isNaN(isoDate.getTime())) {
      return {
        date: isoDate,
        dateString: formatDateString(isoDate),
        timeString: formatTimeString(isoDate),
        isAllDay: false,
      };
    }
    return { date: null, dateString: null, timeString: null, isAllDay: true };
  }

  const parsed = results[0];
  const date = parsed.start.date();

  // Check if time was specified
  const hasTime = parsed.start.isCertain("hour");

  return {
    date,
    dateString: formatDateString(date),
    timeString: hasTime ? formatTimeString(date) : null,
    isAllDay: !hasTime,
  };
}

/**
 * Parse date and time separately
 */
export function parseDateAndTime(
  dateInput: string,
  timeInput?: string,
  referenceDate?: Date
): {
  date: Date | null;
  dateString: string | null;
  timeString: string | null;
  error: string | null;
} {
  // First parse the date
  const dateResult = parseNaturalDate(dateInput, referenceDate);

  if (!dateResult.date) {
    return {
      date: null,
      dateString: null,
      timeString: null,
      error: `Could not parse date: "${dateInput}". Try formats like "tomorrow", "next Monday", or "2024-12-20".`,
    };
  }

  // If we already have a time from the date, use it
  if (dateResult.timeString && !timeInput) {
    return {
      date: dateResult.date,
      dateString: dateResult.dateString,
      timeString: dateResult.timeString,
      error: null,
    };
  }

  // If time input is provided, parse it
  if (timeInput) {
    const timeResult = parseTimeString(timeInput);
    if (timeResult.error) {
      return {
        date: dateResult.date,
        dateString: dateResult.dateString,
        timeString: null,
        error: timeResult.error,
      };
    }

    // Combine date and time
    if (timeResult.hours !== null && timeResult.minutes !== null) {
      dateResult.date.setHours(timeResult.hours, timeResult.minutes, 0, 0);
    }

    return {
      date: dateResult.date,
      dateString: dateResult.dateString,
      timeString: formatTimeString(dateResult.date),
      error: null,
    };
  }

  // Default to 10:00 if no time specified
  dateResult.date.setHours(10, 0, 0, 0);

  return {
    date: dateResult.date,
    dateString: dateResult.dateString,
    timeString: "10:00",
    error: null,
  };
}

/**
 * Parse a time string
 */
function parseTimeString(input: string): {
  hours: number | null;
  minutes: number | null;
  error: string | null;
} {
  const normalizedInput = input.toLowerCase().trim();

  // Common time patterns
  const patterns = [
    // 14:30, 2:30
    /^(\d{1,2}):(\d{2})$/,
    // 14h30, 2h30
    /^(\d{1,2})h(\d{2})?$/,
    // 2pm, 2 pm, 14h
    /^(\d{1,2})\s*(am|pm|h)?$/i,
    // 2:30pm, 2:30 pm
    /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i,
  ];

  for (const pattern of patterns) {
    const match = normalizedInput.match(pattern);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      const period = match[3]?.toLowerCase();

      // Handle AM/PM
      if (period === "pm" && hours < 12) {
        hours += 12;
      } else if (period === "am" && hours === 12) {
        hours = 0;
      }

      // Validate
      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        return { hours, minutes, error: null };
      }
    }
  }

  // Try chrono for natural time
  const chronoResult = chrono.parseDate(`today at ${input}`);
  if (chronoResult) {
    return {
      hours: chronoResult.getHours(),
      minutes: chronoResult.getMinutes(),
      error: null,
    };
  }

  return {
    hours: null,
    minutes: null,
    error: `Could not parse time: "${input}". Try formats like "14:30", "2pm", or "10h00".`,
  };
}

/**
 * Format a Date to YYYY-MM-DD
 */
export function formatDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Format a Date to HH:MM
 */
export function formatTimeString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Calculate end time given start time and duration
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
}

/**
 * Format a date for display
 */
export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < now;
}

/**
 * Get relative date description
 */
export function getRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";
  if (diffDays > 0 && diffDays <= 7) return `in ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return formatDisplayDate(d);
}

// ============================================
// Alias exports for backward compatibility
// ============================================

/**
 * Parse a date string and return YYYY-MM-DD format (alias for parseNaturalDate)
 */
export function parseDate(input: string): string | null {
  const result = parseNaturalDate(input);
  return result.dateString;
}

/**
 * Format time string to HH:MM (alias for formatTimeString with string input)
 */
export function formatTime(input: string): string {
  // Handle already formatted time
  if (/^\d{1,2}:\d{2}$/.test(input)) {
    const [h, m] = input.split(":").map(Number);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  // Try to parse the time
  const result = chrono.parseDate(`today at ${input}`);
  if (result) {
    return formatTimeString(result);
  }

  return "10:00"; // Default fallback
}

/**
 * Add minutes to a time string (alias for calculateEndTime)
 */
export function addMinutes(startTime: string, minutes: number): string {
  return calculateEndTime(startTime, minutes);
}

/**
 * Format date for display (alias for formatDisplayDate)
 */
export function formatDateDisplay(date: string): string {
  return formatDisplayDate(date);
}

/**
 * Check if date is in the past (alias for isPast)
 */
export function isPastDate(date: string): boolean {
  return isPast(date);
}
