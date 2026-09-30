import React from "react";

const STYLES = {
  2: {
    label: "HIGH",
    icon: "↑",
    className:
      "bg-mono-0 text-mono-950 dark:bg-mono-950 dark:text-mono-0 font-bold px-2 py-1 text-xs tracking-wider border-0",
  },
  1: {
    label: "MED",
    icon: "-",
    className:
      "bg-mono-950 text-mono-0 dark:bg-mono-0 dark:text-mono-950 font-medium px-2 py-1 text-xs tracking-wider border border-mono-950 dark:border-mono-0",
  },
  0: {
    label: "LOW",
    icon: "↓",
    className:
      "bg-transparent text-mono-500 border border-mono-700 dark:text-mono-400 dark:border-mono-700 font-normal px-2 py-1 text-xs tracking-wider",
  },
};

export default function PriorityBadge({ priority, className = "" }) {
  const cfg = STYLES[priority] ?? STYLES[0];

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap ${cfg.className} ${className}`}
      title={`Priority: ${cfg.label}`}
    >
      <span aria-hidden="true" className="leading-none">
        {cfg.icon}
      </span>
      {cfg.label}
    </span>
  );
}
