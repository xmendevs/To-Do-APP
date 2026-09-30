import React, { useState, useEffect, createContext, useContext } from "react";
import { useTheme } from "../context/ThemeContext";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const { dark } = useTheme();

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 text-sm uppercase tracking-wider font-medium z-50 transition-all duration-300 ${
            dark
              ? "bg-mono-0 text-mono-950"
              : "bg-mono-950 text-mono-0"
          }`}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
