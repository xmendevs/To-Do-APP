import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function FocusMode() {
  const [isActive, setIsActive] = useState(false);
  const [task, setTask] = useState(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const enterFocusMode = () => {
    // For demo: just use a placeholder task
    setTask({ title: "Current focused task", is_completed: false });
    setIsActive(true);
    setTimeLeft(25 * 60);
  };

  const exitFocusMode = () => {
    setIsActive(false);
    setTask(null);
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!user?.is_premium) return null;

  if (!isActive) {
    return (
      <button
        onClick={enterFocusMode}
        className="fixed bottom-6 right-6 btn-primary shadow-lg"
      >
        Focus Mode
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-mono-0 dark:bg-mono-950 flex flex-col items-center justify-center">
      <button
        onClick={exitFocusMode}
        className="absolute top-6 right-6 text-mono-400 hover:text-mono-950 dark:hover:text-mono-0"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-mono-400 mb-4">Focusing on</p>
        <h2 className="text-3xl font-bold mb-12">{task?.title}</h2>

        <div className="text-8xl font-bold tracking-wider mb-12 tabular-nums">
          {formatTime(timeLeft)}
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="btn-primary"
          >
            {isRunning ? "Pause" : "Start"}
          </button>
          <button
            onClick={() => { setTimeLeft(25 * 60); setIsRunning(false); }}
            className="btn-secondary"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
