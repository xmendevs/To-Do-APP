import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import TaskItem from "./TaskItem";
import StatusDropdown from "./StatusDropdown";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";

export default function TaskList({ refreshKey = 0, onTasksChange, boardId = null }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const url = boardId ? `/tasks?board_id=${boardId}` : "/tasks";
      const res = await api.get(url);
      setTasks(res.data);
      onTasksChange?.(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshKey, boardId]);

  const handleToggle = useCallback(async (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_completed: !t.is_completed } : t))
    );
    try {
      await api.patch(`/tasks/${id}`, {
        is_completed: !tasks.find((t) => t.id === id)?.is_completed,
      });
    } catch (err) {
      console.error(err);
      fetchTasks();
    }
  }, [tasks]);

  const handleDelete = useCallback(async (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.delete(`/tasks/${id}`);
    } catch (err) {
      console.error(err);
      fetchTasks();
    }
  }, []);

  const handleAddSubtask = useCallback(async (parentId, title) => {
    try {
      const res = await api.post("/tasks", { title, parent_id: parentId });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === parentId ? { ...t, subtasks: [...(t.subtasks || []), res.data] } : t
        )
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleStatusChange = useCallback(() => {
    fetchTasks();
  }, []);

  // Keyboard navigation
  const { focusIndex, setFocusIndex } = useKeyboardNavigation(tasks.length, {
    onToggle: (index) => {
      const task = tasks[index];
      if (task) handleToggle(task.id);
    },
    onEdit: (index) => {
      const task = tasks[index];
      if (task) {
        const editButton = document.querySelector(`[data-task-id="${task.id}"] .edit-btn`);
        if (editButton) editButton.click();
      }
    },
  });

  if (loading) {
    return (
      <div className="text-center py-12 text-mono-400 uppercase tracking-widest animate-pulse">
        Loading tasks...
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-mono-400 uppercase tracking-widest">
        No tasks yet. Add one above.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-mono-400 uppercase tracking-wider">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </p>
        <p className="text-xs text-mono-400 uppercase tracking-wider">
          <kbd className="border border-mono-300 dark:border-mono-700 px-1.5 py-0.5">j</kbd>{" "}
          <kbd className="border border-mono-300 dark:border-mono-700 px-1.5 py-0.5">k</kbd>{" "}
          navigate ·{" "}
          <kbd className="border border-mono-300 dark:border-mono-700 px-1.5 py-0.5">x</kbd>{" "}
          toggle ·{" "}
          <kbd className="border border-mono-300 dark:border-mono-700 px-1.5 py-0.5">e</kbd>{" "}
          edit
        </p>
      </div>
      <AnimatePresence mode="popLayout">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => setFocusIndex(index)}
          >
            <div data-task-id={task.id}>
              <TaskItem
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onAddSubtask={handleAddSubtask}
                isFocused={focusIndex === index}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
