import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";

export default function SuggestedRoutines({ onTaskAdded }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState(new Set());

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const res = await api.get("/tasks/suggested");
      setSuggestions(res.data);
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuggestion = async (suggestion) => {
    try {
      await api.post("/tasks", {
        title: suggestion.title,
        due_date: suggestion.suggested_time,
      });
      setAddedIds((prev) => new Set([...prev, suggestion.title]));
      onTaskAdded?.();
    } catch (err) {
      console.error("Failed to add suggestion:", err);
    }
  };

  const getRoutineLabel = (type) => {
    switch (type) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      default:
        return "Occasional";
    }
  };

  if (loading) {
    return (
      <div className="mb-8">
        <p className="text-xs text-mono-400 uppercase tracking-wider mb-3">Suggested Routines</p>
        <div className="animate-pulse text-sm text-mono-400">Analyzing your patterns...</div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <p className="text-xs text-mono-400 uppercase tracking-wider mb-3">Suggested Routines</p>
      <div className="space-y-2">
        <AnimatePresence>
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-center justify-between p-3 border border-mono-200 dark:border-mono-800 bg-mono-50 dark:bg-mono-900"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{suggestion.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-mono-400 uppercase tracking-wider">
                    {getRoutineLabel(suggestion.routine_type)}
                  </span>
                  <span className="text-xs text-mono-400">
                    · {suggestion.occurrences}x completed
                  </span>
                  <span className="text-xs text-mono-400">
                    · {Math.round(suggestion.confidence * 100)}% match
                  </span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleAddSuggestion(suggestion)}
                disabled={addedIds.has(suggestion.title)}
                className={`ml-4 w-8 h-8 border-2 flex items-center justify-center transition-colors ${
                  addedIds.has(suggestion.title)
                    ? "bg-mono-950 text-mono-0 border-mono-950 dark:bg-mono-0 dark:text-mono-950 dark:border-mono-0"
                    : "border-mono-300 dark:border-mono-700 hover:border-mono-950 dark:hover:border-mono-0"
                }`}
              >
                {addedIds.has(suggestion.title) ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
