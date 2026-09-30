import React, { useState } from "react";
import { motion } from "framer-motion";
import api from "../api";
import { parseTaskDate } from "../utils/dateParser";

export default function TaskInput({ onTaskAdded = () => {}, boardId = null }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const { title: cleanTitle, dueDate } = parseTaskDate(title);
      
      const payload = { title: cleanTitle, description, priority };
      if (dueDate) payload.due_date = dueDate.toISOString();
      if (boardId) payload.board_id = boardId;
      
      const res = await api.post("/tasks", payload);
      onTaskAdded(res.data);
      setTitle("");
      setDescription("");
      setPriority(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="mb-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card p-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='What needs to be done? (e.g., "go to gym by 6 tomorrow")'
          className="input-field mb-4 text-lg"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="input-field mb-4 resize-none"
          rows={2}
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {["LOW", "MED", "HIGH"].map((label, p) => (
              <motion.button
                key={p}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPriority(p)}
                className={`px-4 py-1.5 text-xs uppercase tracking-wider border-2 transition-colors ${
                  priority === p
                    ? "bg-mono-950 text-mono-0 border-mono-950 dark:bg-mono-0 dark:text-mono-950 dark:border-mono-0"
                    : "border-mono-300 dark:border-mono-700 hover:border-mono-950 dark:hover:border-mono-0"
                }`}
              >
                {label}
              </motion.button>
            ))}
          </div>
          <motion.button
            type="submit"
            disabled={loading || !title.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? "..." : "Add Task"}
          </motion.button>
        </div>
      </div>
    </motion.form>
  );
}
