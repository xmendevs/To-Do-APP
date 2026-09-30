import * as chrono from "chrono-node";

/**
 * Parse natural language date from task title.
 * Returns { title: cleanedTitle, dueDate: Date|null }
 */
export function parseTaskDate(rawTitle) {
  if (!rawTitle || !rawTitle.trim()) {
    return { title: rawTitle, dueDate: null };
  }

  const results = chrono.parse(rawTitle);
  
  if (results.length > 0) {
    const result = results[0];
    const dueDate = result.start.date();
    
    // Remove the matched text from the title
    const matchText = result.text;
    const title = rawTitle.replace(matchText, "").replace(/\s+/g, " ").trim();
    
    return { title, dueDate };
  }

  return { title: rawTitle, dueDate: null };
}

/**
 * Format a Date object as a minimal badge string.
 * Examples: "Today, 6:00 PM" | "Tomorrow, 9:00 AM" | "Oct 30, 2:00 PM"
 */
export function formatDueDate(date) {
  if (!date) return null;

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `Today, ${timeStr}`;
  if (isTomorrow) return `Tomorrow, ${timeStr}`;

  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return `${dateStr}, ${timeStr}`;
}
