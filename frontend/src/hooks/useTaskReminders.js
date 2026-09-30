import { useEffect, useRef, useCallback } from "react";

/**
 * Custom hook that monitors tasks and fires notifications when due soon.
 * @param {Array} tasks - Array of task objects with due_date field
 * @param {number} reminderMinutes - Minutes before due date to trigger (default: 5)
 */
export function useTaskReminders(tasks, reminderMinutes = 5) {
  const notifiedRef = useRef(new Set());

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const checkReminders = useCallback(() => {
    const now = new Date();
    const threshold = reminderMinutes * 60 * 1000; // Convert to milliseconds

    tasks.forEach((task) => {
      if (!task.due_date || task.is_completed) return;
      if (notifiedRef.current.has(task.id)) return;

      const dueDate = new Date(task.due_date);
      const timeUntilDue = dueDate.getTime() - now.getTime();

      // Trigger when within the reminder window (and not past due)
      if (timeUntilDue > 0 && timeUntilDue <= threshold) {
        notifiedRef.current.add(task.id);

        // Browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Task Reminder", {
            body: `Your task "${task.title}" is due in ${reminderMinutes} minutes.`,
            icon: "/favicon.ico",
          });
        }

        // Audio chime (soft, minimalist)
        try {
          const audio = new Audio("/chime.mp3");
          audio.volume = 0.3;
          audio.play().catch(() => {
            // Autoplay blocked - user interaction needed first
          });
        } catch (e) {
          // Audio not supported
        }

        // In-app toast fallback
        showToast(`"${task.title}" is due in ${reminderMinutes} minutes`);
      }
    });
  }, [tasks, reminderMinutes]);

  // Run check every 60 seconds
  useEffect(() => {
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [checkReminders]);

  // Also check immediately when tasks change
  useEffect(() => {
    checkReminders();
  }, [checkReminders]);
}

// Simple toast fallback
function showToast(message) {
  const toast = document.createElement("div");
  toast.className =
    "fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 text-sm uppercase tracking-wider font-medium z-50 bg-mono-950 text-mono-0 dark:bg-mono-0 dark:text-mono-950 animate-pulse";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}
