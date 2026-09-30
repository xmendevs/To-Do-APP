import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setError("");
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, email, password);
      }
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message = typeof detail === "string" ? detail : "Authentication failed";
      setError(message);
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
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-mono-950/30 dark:bg-mono-950/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="glass-modal w-full max-w-lg border-2 border-mono-200 dark:border-mono-800 p-10 relative shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-mono-400 hover:text-mono-950 dark:hover:text-mono-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold uppercase tracking-widest mb-6">
              {isLogin ? "Login" : "Register"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="input-field"
                required
              />
              {!isLogin && (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="input-field"
                  required
                />
              )}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="input-field"
                required
              />
              {error && <p className="text-sm text-mono-500">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? "..." : isLogin ? "Login" : "Create Account"}
              </button>
            </form>

            <p className="text-center text-sm text-mono-500 mt-4">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                className="underline hover:text-mono-950 dark:hover:text-mono-0"
              >
                {isLogin ? "Register" : "Login"}
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
