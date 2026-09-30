import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import api from "../api";
import StatusDropdown, { STATUSES } from "./StatusDropdown";
import PriorityBadge from "./PriorityBadge";
import { formatDueDate } from "../utils/dateParser";

export default function KanbanView({ boardId = null, refreshKey = 0, onTasksChange }) {
  // Kanban owns its state so column moves can be applied locally.
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const scrollRef = useRef(null);

  const fetchTasks = useCallback(async () => {
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
  }, [boardId, onTasksChange]);

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [fetchTasks, refreshKey]);

  /**
   * Optimistic status change: move the card immediately, then persist.
   * Reverts to server truth if the PATCH fails.
   */
  const handleStatusChange = useCallback(
    async (taskId, newStatus) => {
      setOpenMenuId(null);

      const previous = tasks;
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      try {
        // NOTE: API expects snake_case keys, not "IN PROGRESS".
        const { data } = await api.patch(`/tasks/${taskId}`, { status: newStatus });
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...data } : t)));
        onTasksChange?.(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
      } catch (err) {
        console.error("Status update failed", err);
        setTasks(previous); // revert
        await fetchTasks(); // resync with server
      }
    },
    [tasks, fetchTasks, onTasksChange]
  );

  const handleDelete = useCallback(async (taskId) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await api.delete(`/tasks/${taskId}`);
      onTasksChange?.(previous.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error(err);
      setTasks(previous);
    }
  }, [tasks, onTasksChange]);

  const handleDragStart = (e, task) => {
    setDraggedId(task.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(task.id));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const id = Number(draggedId ?? e.dataTransfer.getData("text/plain"));
    setDraggedId(null);
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    handleStatusChange(id, status); // reuse the same optimistic path
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm uppercase tracking-widest text-mono-400 animate-pulse">
        Loading board...
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="-mx-4 overflow-x-auto px-4 pb-4">
      <div className="flex min-w-max gap-4">
        {STATUSES.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.value);

          return (
            <section
              key={col.value}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.value)}
              className="flex w-72 flex-shrink-0 flex-col"
            >
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-widest text-mono-400">
                  {col.label}
                </h3>
                <span className="bg-mono-100 px-2 py-0.5 text-xs text-mono-500 dark:bg-mono-900 dark:text-mono-400">
                  {columnTasks.length}
                </span>
              </header>

              {/* overflow-visible so dropdowns aren't clipped */}
              <div className="min-h-[120px] space-y-2 overflow-visible">
                {columnTasks.map((task) => {
                  const menuOpen = openMenuId === task.id;

                  return (
                    <motion.article
                      key={task.id}
                      layout
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      whileHover={{ scale: 1.01 }}
                      // relative + dynamic z-index lifts the open card above siblings
                      style={{ zIndex: menuOpen ? 40 : 1 }}
                      className={`relative cursor-grab border-2 bg-mono-0 p-3 active:cursor-grabbing dark:bg-mono-950 ${
                        menuOpen
                          ? "border-mono-950 dark:border-mono-0"
                          : draggedId === task.id
                          ? "border-mono-950 opacity-50 dark:border-mono-0"
                          : "border-mono-200 dark:border-mono-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`flex-1 text-sm font-medium ${
                            task.is_completed ? "task-completed" : ""
                          }`}
                        >
                          {task.title}
                        </p>
                        <button
                          onClick={() => handleDelete(task.id)}
                          aria-label="Delete task"
                          className="flex-shrink-0 text-mono-400 transition-colors hover:text-mono-950 dark:hover:text-mono-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {task.tags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {task.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="border border-mono-300 px-1.5 py-0.5 font-mono text-xs text-mono-500 dark:border-mono-700 dark:text-mono-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <StatusDropdown
                            taskId={task.id}
                            currentStatus={task.status}
                            open={menuOpen}
                            onToggle={(next) => setOpenMenuId(next ? task.id : null)}
                            onSelect={handleStatusChange}
                          />
                          <PriorityBadge priority={task.priority} />
                        </div>

                        {task.due_date && (
                          <span className="font-mono text-xs text-mono-400">
                            {formatDueDate(new Date(task.due_date))}
                          </span>
                        )}
                      </div>
                    </motion.article>
                  );
                })}

                {columnTasks.length === 0 && (
                  <p className="border border-dashed border-mono-300 px-3 py-6 text-center text-xs uppercase tracking-wider text-mono-400 dark:border-mono-800">
                    Drop here
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
