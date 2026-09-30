import { useState } from "react";
import AuthModal from "./AuthModal";
import { useTheme } from "../context/ThemeContext";

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { dark, toggle } = useTheme();

  const openModal = () => setShowAuthModal(true);
  const closeModal = () => setShowAuthModal(false);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 border-b-2 border-mono-200 dark:border-mono-800">
        <h1 className="text-xl font-bold tracking-widest">MONO</h1>
        <div className="flex gap-4">
          <button
            onClick={toggle}
            className="w-10 h-10 border-2 border-mono-950 dark:border-mono-0 flex items-center justify-center transition-colors hover:bg-mono-950 hover:text-mono-0 dark:hover:bg-mono-0 dark:hover:text-mono-950"
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
          </button>
          <button onClick={openModal} className="btn-primary">
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center space-y-6 px-4">
        <h2 className="text-4xl md:text-6xl font-bold tracking-widest text-center">
          WELCOME TO MONO
        </h2>
        <p className="text-mono-500 dark:text-mono-400 font-mono text-center">
          Sign in to start organizing your tasks
        </p>
        <button onClick={openModal} className="btn-primary text-lg px-10 py-4 mt-4">
          Get Started
        </button>
      </main>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={closeModal} />
    </div>
  );
}
