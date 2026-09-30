import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const STATUSES = [
  { value: "backlog", label: "Backlog" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

function statusStyle(status) {
  switch (status) {
    case "in_progress":
      return "border-mono-500 text-mono-600 dark:text-mono-300";
    case "blocked":
      return "bg-mono-950 text-mono-0 border-mono-950 dark:bg-mono-0 dark:text-mono-950 dark:border-mono-0";
    case "done":
      return "border-mono-950 text-mono-950 dark:border-mono-0 dark:text-mono-0";
    default:
      return "border-mono-300 text-mono-500 dark:border-mono-700 dark:text-mono-400";
  }
}

/**
 * Dropdown whose open state is owned by the parent so only one can be open
 * at a time. `open` + `onToggle` also lets the parent raise the card's
 * z-index so the menu paints above later sibling cards.
 */
export default function StatusDropdown({
  taskId,
  currentStatus,
  open,
  onToggle,
  onSelect,
}) {
  const ref = useRef(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onToggle(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") onToggle(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onToggle]);

  const current = STATUSES.find((s) => s.value === currentStatus) ?? STATUSES[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => onToggle(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`border-2 px-2 py-1 text-xs uppercase tracking-wider transition-colors hover:border-mono-950 dark:hover:border-mono-0 ${statusStyle(currentStatus)}`}
      >
        {current.label}
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            // z-50 + solid background so underlying cards can't bleed through
            className="absolute left-0 top-full z-50 mt-1 w-max min-w-[9rem] border-2 border-mono-700 bg-mono-950 text-mono-0 shadow-2xl"
          >
            {STATUSES.map((s) => (
              <li key={s.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={currentStatus === s.value}
                  onClick={() => onSelect(taskId, s.value)}
                  className={`block w-full whitespace-nowrap px-4 py-2 text-left text-xs uppercase tracking-wider transition-colors ${
                    currentStatus === s.value
                      ? "bg-mono-0 text-mono-950"
                      : "hover:bg-mono-800 hover:text-mono-0"
                  }`}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
