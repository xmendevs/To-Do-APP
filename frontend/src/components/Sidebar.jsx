import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";

const SIDEBAR_W = 256; // w-64

const IconCollapse = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
  </svg>
);

const IconExpand = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export default function Sidebar({ activeBoardId, onSelectBoard }) {
  const [boards, setBoards] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [showInput, setShowInput] = useState(false);

  const fetchBoards = useCallback(async () => {
    try {
      const res = await api.get("/boards");
      setBoards(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  // Drive layout padding from a CSS var so main content shifts smoothly.
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-w",
      isOpen ? `${SIDEBAR_W}px` : "0px"
    );
  }, [isOpen]);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    try {
      const res = await api.post("/boards", { name: newBoardName.trim() });
      setBoards((prev) => [...prev, res.data]);
      setNewBoardName("");
      setShowInput(false);
      onSelectBoard(res.data.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBoard = async (e, boardId) => {
    e.stopPropagation();
    try {
      await api.delete(`/boards/${boardId}`);
      const remaining = boards.filter((b) => b.id !== boardId);
      setBoards(remaining);
      if (activeBoardId === boardId && remaining.length > 0) {
        onSelectBoard(remaining[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelect = (id) => {
    onSelectBoard(id);
    setIsOpen(false);
  };

  const toggleBtn =
    "flex items-center justify-center border-2 border-mono-950 bg-transparent text-mono-950 transition-colors hover:bg-mono-950 hover:text-mono-0 dark:border-mono-0 dark:text-mono-0 dark:hover:bg-mono-0 dark:hover:text-mono-950";

  return (
    <>
      {/* When CLOSED: floating toggle in the content area (below navbar). */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open boards sidebar"
          aria-expanded={false}
          title="Boards"
          className={`${toggleBtn} fixed z-50`}
          style={{ top: "calc(3.5rem + 0.75rem)", left: "4rem", width: 40, height: 40 }}
        >
          <IconExpand />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Scrim on small screens */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 top-[3.5rem] z-30 bg-mono-950/40 md:hidden"
            />

            <motion.aside
              initial={{ x: -SIDEBAR_W }}
              animate={{ x: 0 }}
              exit={{ x: -SIDEBAR_W }}
              transition={{ type: "tween", duration: 0.2 }}
              style={{ width: SIDEBAR_W }}
              className="fixed left-0 top-[3.5rem] bottom-0 z-40 overflow-y-auto border-r-2 border-mono-200 bg-mono-0 dark:border-mono-800 dark:bg-mono-950"
            >
              {/* Header: title left, collapse toggle right - no overlap */}
              <div className="flex items-center justify-between gap-3 border-b-2 border-mono-200 px-4 py-4 dark:border-mono-800">
                <h2 className="text-xs uppercase tracking-widest text-mono-400">
                  Boards
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close boards sidebar"
                  aria-expanded={true}
                  title="Close sidebar"
                  className={`${toggleBtn} flex-shrink-0`}
                  style={{ width: 32, height: 32 }}
                >
                  <IconCollapse className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4">
                <div className="space-y-1">
                  {boards.map((board) => (
                    <div
                      key={board.id}
                      onClick={() => handleSelect(board.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && handleSelect(board.id)}
                      className={`group flex cursor-pointer items-center justify-between gap-2 px-3 py-2 transition-colors ${
                        activeBoardId === board.id
                          ? "bg-mono-950 text-mono-0 dark:bg-mono-0 dark:text-mono-950"
                          : "hover:bg-mono-100 dark:hover:bg-mono-900"
                      }`}
                    >
                      <span className="truncate text-sm font-medium">{board.name}</span>
                      <button
                        onClick={(e) => handleDeleteBoard(e, board.id)}
                        aria-label={`Delete ${board.name}`}
                        className="flex-shrink-0 opacity-0 transition-opacity hover:text-mono-950 group-hover:opacity-100 dark:hover:text-mono-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {showInput ? (
                  <form onSubmit={handleCreateBoard} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newBoardName}
                      onChange={(e) => setNewBoardName(e.target.value)}
                      placeholder="Board name"
                      autoFocus
                      className="min-w-0 flex-1 border border-mono-300 bg-transparent px-2 py-1 text-sm focus:border-mono-950 focus:outline-none dark:border-mono-700 dark:focus:border-mono-0"
                    />
                    <button type="submit" className="btn-primary flex-shrink-0 px-2 py-1 text-xs">
                      Add
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowInput(true)}
                    className="mt-3 flex items-center gap-2 text-sm text-mono-400 transition-colors hover:text-mono-950 dark:hover:text-mono-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Board
                  </button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
