import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function DeepWorkMode({ tasks, onExit }) {
  const [isActive, setIsActive] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef(null);
  const { user } = useAuth();

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((t) => t + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // Fullscreen handling
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.error("Fullscreen not supported:", err);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.error("Exit fullscreen error:", err);
    }
  }, []);

  // Listen for fullscreen changes (user pressing ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
        setIsActive(false);
        setIsRunning(false);
        setTimeElapsed(0);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isFullscreen]);

  const startDeepWork = async (task) => {
    setSelectedTask(task);
    setIsActive(true);
    setIsRunning(true);
    await enterFullscreen();
  };

  const stopDeepWork = async () => {
    setIsRunning(false);
    await exitFullscreen();
    setIsActive(false);
    setSelectedTask(null);
    setTimeElapsed(0);
    onExit?.();
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Get incomplete tasks for selection
  const availableTasks = tasks.filter((t) => !t.is_completed);

  // Task selection screen
  if (!isActive) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm uppercase tracking-widest text-mono-400">Deep Work</h3>
        </div>
        {availableTasks.length === 0 ? (
          <p className="text-sm text-mono-400">No active tasks available for deep work.</p>
        ) : (
          <div className="space-y-2">
            {availableTasks.slice(0, 5).map((task) => (
              <motion.button
                key={task.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => startDeepWork(task)}
                className="w-full text-left p-4 border-2 border-mono-200 dark:border-mono-800 hover:border-mono-950 dark:hover:border-mono-0 transition-colors"
              >
                <p className="font-medium">{task.title}</p>
                {task.description && (
                  <p className="text-sm text-mono-400 mt-1">{task.description}</p>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Active deep work screen
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-mono-950 flex flex-col items-center justify-center"
    >
      <button
        onClick={stopDeepWork}
        className="absolute top-6 right-6 text-mono-500 hover:text-mono-0 transition-colors"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="text-center max-w-2xl px-8">
        <p className="text-sm uppercase tracking-widest text-mono-500 mb-4">Deep Work Session</p>
        <h2 className="text-4xl md:text-6xl font-bold text-mono-0 mb-12">
          {selectedTask?.title}
        </h2>
        {selectedTask?.description && (
          <p className="text-lg text-mono-400 mb-12">{selectedTask.description}</p>
        )}

        <div className="text-8xl md:text-9xl font-mono font-light text-mono-0 tracking-wider mb-12 tabular-nums">
          {formatTime(timeElapsed)}
        </div>

        <div className="flex gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsRunning(!isRunning)}
            className="bg-mono-0 text-mono-950 px-8 py-3 font-medium uppercase tracking-wider text-sm"
          >
            {isRunning ? "Pause" : "Resume"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={stopDeepWork}
            className="border-2 border-mono-0 text-mono-0 px-8 py-3 font-medium uppercase tracking-wider text-sm hover:bg-mono-0 hover:text-mono-950 transition-colors"
          >
            End Session
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
