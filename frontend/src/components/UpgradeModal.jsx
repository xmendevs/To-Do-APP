import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function UpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, upgrade } = useAuth();

  const handleUpgrade = async () => {
    await upgrade();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-mono-950/50 backdrop-blur-sm">
      <div className="card w-full max-w-md p-8 relative">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-mono-400 hover:text-mono-950 dark:hover:text-mono-0"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold uppercase tracking-widest mb-4">Go Premium</h2>
        <p className="text-mono-500 dark:text-mono-400 mb-6">
          Unlock subtasks, analytics, and focus mode.
        </p>

        <ul className="space-y-3 mb-8">
          {["Sub-tasks & nesting", "Productivity analytics", "Focus mode with Pomodoro"].map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-mono-950 dark:border-mono-0 flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <button onClick={handleUpgrade} className="btn-primary w-full">
          Upgrade Now
        </button>
      </div>
    </div>
  );
}
