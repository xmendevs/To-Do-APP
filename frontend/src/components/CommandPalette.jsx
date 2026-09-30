import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";

export default function CommandPalette({ isOpen, onClose, onTaskAdded = () => {} }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      await api.post("/tasks", { title: query.trim() });
      onTaskAdded();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-mono-950/30 dark:bg-mono-950/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="glass-modal w-full max-w-lg border-2 border-mono-200 dark:border-mono-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit} className="p-2">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a task..."
                className="w-full bg-transparent px-4 py-3 text-lg text-mono-950 dark:text-mono-0 placeholder-mono-400 focus:outline-none"
              />
            </form>
            <div className="border-t border-mono-200 dark:border-mono-800 px-4 py-2">
              <p className="text-xs text-mono-400 uppercase tracking-wider">
                Press Enter to add task
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
