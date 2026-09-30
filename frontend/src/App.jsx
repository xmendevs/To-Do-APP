import React, { useState, useEffect, useCallback } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import TaskInput from "./components/TaskInput";
import TaskList from "./components/TaskList";
import KanbanView from "./components/KanbanView";
import ViewSwitcher from "./components/ViewSwitcher";
import Analytics from "./components/Analytics";
import FocusMode from "./components/FocusMode";
import UpgradeModal from "./components/UpgradeModal";
import LandingPage from "./components/LandingPage";
import CommandPalette from "./components/CommandPalette";
import UserGreeting from "./components/UserGreeting";
import DeepWorkMode from "./components/DeepWorkMode";
import SuggestedRoutines from "./components/SuggestedRoutines";
import { useTaskReminders } from "./hooks/useTaskReminders";
import { useAuth } from "./context/AuthContext";

function AppContent() {
  const { user, loading } = useAuth();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [view, setView] = useState("list");

  // Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleTaskAdded = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleBoardChange = useCallback((boardId) => {
    setActiveBoardId(boardId);
    setRefreshKey((k) => k + 1);
  }, []);

  useTaskReminders(tasks, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg tracking-widest uppercase animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen transition-colors duration-300 flex flex-col">
      <Navbar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />

      {/* Grid: sidebar column + content column. Sidebar is `fixed`, so the
          content column takes the full width and padding comes from Sidebar. */}
      <div className="flex-1">
        <Sidebar activeBoardId={activeBoardId} onSelectBoard={handleBoardChange} />

        <main className="w-full max-w-3xl mx-auto px-4 py-6 sidebar-pad">
          {/* Dedicated header row: greeting left, view toggle right */}
          <header className="flex items-center justify-between gap-4 mb-6">
            <UserGreeting />
            <ViewSwitcher view={view} onViewChange={setView} />
          </header>

          <TaskInput onTaskAdded={handleTaskAdded} boardId={activeBoardId} />
          <SuggestedRoutines onTaskAdded={handleTaskAdded} />
          <DeepWorkMode tasks={tasks} onExit={() => setRefreshKey((k) => k + 1)} />

          {view === "list" ? (
            <TaskList
              refreshKey={refreshKey}
              onTasksChange={setTasks}
              boardId={activeBoardId}
            />
          ) : (
            <KanbanView
              boardId={activeBoardId}
              refreshKey={refreshKey}
              onTasksChange={setTasks}
            />
          )}

          {user.is_premium && <Analytics />}
        </main>
      </div>

      <FocusMode />
      <UpgradeModal />
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onTaskAdded={handleTaskAdded}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
