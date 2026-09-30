import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ onOpenCommandPalette }) {
  const { dark, toggle } = useTheme();
  const { user, logout } = useAuth();

  return (
    <nav className="glass border-b-2 border-mono-200 dark:border-mono-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      <h1 className="text-xl font-bold uppercase tracking-widest">Mono</h1>
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 border border-mono-300 dark:border-mono-700 text-mono-500 dark:text-mono-400 text-sm hover:border-mono-500 dark:hover:border-mono-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden sm:inline">Quick Add</span>
          <kbd className="hidden sm:inline text-xs border border-mono-300 dark:border-mono-700 px-1.5 py-0.5">⌘K</kbd>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggle}
          className="w-10 h-10 border-2 border-mono-950 dark:border-mono-0 flex items-center justify-center transition-colors hover:bg-mono-950 hover:text-mono-0 dark:hover:bg-mono-0 dark:hover:text-mono-950"
          title={dark ? "Light mode" : "Dark mode"}
        >
          {dark ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </motion.button>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm uppercase tracking-wider">{user.username}</span>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={logout}
              className="btn-secondary text-xs py-1.5 px-4"
            >
              Logout
            </motion.button>
          </div>
        )}
      </div>
    </nav>
  );
}
