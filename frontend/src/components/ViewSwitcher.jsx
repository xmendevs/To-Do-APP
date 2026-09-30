import React from "react";
import { motion } from "framer-motion";

export default function ViewSwitcher({ view, onViewChange }) {
  return (
    <div className="flex items-center border-2 border-mono-200 dark:border-mono-800">
      <button
        onClick={() => onViewChange("list")}
        className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
          view === "list"
            ? "bg-mono-950 text-mono-0 dark:bg-mono-0 dark:text-mono-950"
            : "text-mono-400 hover:text-mono-950 dark:hover:text-mono-0"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <button
        onClick={() => onViewChange("kanban")}
        className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
          view === "kanban"
            ? "bg-mono-950 text-mono-0 dark:bg-mono-0 dark:text-mono-950"
            : "text-mono-400 hover:text-mono-950 dark:hover:text-mono-0"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      </button>
    </div>
  );
}
