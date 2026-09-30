import React, { useState } from "react";
import { motion } from "framer-motion";
import api from "../api";
import { formatDueDate } from "../utils/dateParser";
import PriorityBadge from "./PriorityBadge";

export default function TaskItem({ task, onToggle, onDelete, onAddSubtask, isFocused, onEdit }) {
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [editPriority, setEditPriority] = useState(task.priority);

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;
    onAddSubtask(task.id, subtaskTitle);
    setSubtaskTitle("");
    setShowSubtaskInput(false);
  };

  const handleSaveEdit = async () => {
    try {
      await api.patch(`/tasks/${task.id}`, {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
      });
      setIsEditing(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const priorityLabels = ["Low", "Med", "High"];
  const priorityColors = [
    "border-mono-300 dark:border-mono-700",
    "border-mono-500 dark:border-mono-500",
    "border-mono-950 dark:border-mono-0",
  ];

  const dueDateBadge = task.due_date ? formatDueDate(new Date(task.due_date)) : null;

  if (isEditing) {
    return (
      <div className="card p-4 border-l-4 border-mono-950 dark:border-mono-0">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="input-field mb-3"
          placeholder="Task title"
        />
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          className="input-field mb-3 resize-none"
          placeholder="Description"
          rows={2}
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {[0, 1, 2].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setEditPriority(p)}
                className={`px-3 py-1 text-xs uppercase tracking-wider border-2 transition-colors ${
                  editPriority === p
                    ? "bg-mono-950 text-mono-0 border-mono-950 dark:bg-mono-0 dark:text-mono-950 dark:border-mono-0"
                    : "border-mono-300 dark:border-mono-700 hover:border-mono-950 dark:hover:border-mono-0"
                }`}
              >
                {priorityLabels[p]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} className="btn-primary text-xs py-1 px-3">
              Save
            </button>
            <button onClick={() => setIsEditing(false)} className="btn-secondary text-xs py-1 px-3">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`card p-4 border-l-4 ${priorityColors[task.priority] || priorityColors[0]} transition-all duration-200 ${
        isFocused ? "ring-1 ring-mono-950 dark:ring-mono-0" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Custom blocky checkbox */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onToggle(task.id)}
          className={`w-6 h-6 border-2 flex-shrink-0 mt-0.5 transition-all duration-200 flex items-center justify-center ${
            task.is_completed
              ? "bg-mono-950 border-mono-950 dark:bg-mono-0 dark:border-mono-0"
              : "border-mono-400 dark:border-mono-600 hover:border-mono-950 dark:hover:border-mono-0"
          }`}
        >
          {task.is_completed && (
            <svg className="w-4 h-4 text-mono-0 dark:text-mono-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </motion.button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-medium ${task.is_completed ? "task-completed" : ""}`}>
              {task.title}
            </p>
            <div className="flex flex-shrink-0 items-center gap-2">
              <PriorityBadge priority={task.priority} />
              {dueDateBadge && (
                <span className="border border-mono-300 px-2 py-0.5 font-mono text-xs text-mono-500 dark:border-mono-700 dark:text-mono-400">
                  {dueDateBadge}
                </span>
              )}
            </div>
          </div>
          {task.description && (
            <p className="text-sm text-mono-500 dark:text-mono-400 mt-1">{task.description}</p>
          )}

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-3 ml-4 space-y-2">
              {task.subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-3">
                  <button
                    onClick={() => onToggle(sub.id)}
                    className={`w-4 h-4 border-2 flex-shrink-0 flex items-center justify-center ${
                      sub.is_completed
                        ? "bg-mono-950 border-mono-950 dark:bg-mono-0 dark:border-mono-0"
                        : "border-mono-400 dark:border-mono-600"
                    }`}
                  >
                    {sub.is_completed && (
                      <svg className="w-3 h-3 text-mono-0 dark:text-mono-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={`text-sm ${sub.is_completed ? "line-through text-mono-400" : ""}`}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Add subtask */}
          {showSubtaskInput ? (
            <form onSubmit={handleAddSubtask} className="mt-3 ml-4 flex gap-2">
              <input
                type="text"
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                placeholder="Subtask title..."
                className="input-field text-sm py-1 px-3"
                autoFocus
              />
              <button type="submit" className="btn-primary text-xs py-1 px-3">Add</button>
              <button type="button" onClick={() => setShowSubtaskInput(false)} className="btn-secondary text-xs py-1 px-3">Cancel</button>
            </form>
          ) : (
            <button
              onClick={() => setShowSubtaskInput(true)}
              className="mt-3 ml-4 text-xs uppercase tracking-wider text-mono-400 hover:text-mono-950 dark:hover:text-mono-0 transition-colors"
            >
              + Subtask
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setEditTitle(task.title);
              setEditDescription(task.description);
              setEditPriority(task.priority);
              setIsEditing(true);
            }}
            className="text-mono-400 hover:text-mono-950 dark:hover:text-mono-0 transition-colors"
            title="Edit task (e)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(task.id)}
            className="text-mono-400 hover:text-mono-950 dark:hover:text-mono-0 transition-colors"
            title="Delete task"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
