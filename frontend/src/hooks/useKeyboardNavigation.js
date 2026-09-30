import { useState, useEffect, useCallback } from "react";

export function useKeyboardNavigation(itemCount, { onToggle, onEdit } = {}) {
  const [focusIndex, setFocusIndex] = useState(-1);

  const isTyping = useCallback(() => {
    const active = document.activeElement;
    if (!active) return false;
    const tag = active.tagName.toLowerCase();
    return tag === "input" || tag === "textarea" || active.isContentEditable;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Disable shortcuts when typing
      if (isTyping()) return;

      switch (e.key) {
        case "j":
          e.preventDefault();
          setFocusIndex((prev) => (prev < itemCount - 1 ? prev + 1 : prev));
          break;
        case "k":
          e.preventDefault();
          setFocusIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "x":
        case "Enter":
          e.preventDefault();
          if (focusIndex >= 0 && onToggle) onToggle(focusIndex);
          break;
        case "e":
          e.preventDefault();
          if (focusIndex >= 0 && onEdit) onEdit(focusIndex);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [itemCount, focusIndex, onToggle, onEdit, isTyping]);

  const resetFocus = useCallback(() => setFocusIndex(-1), []);

  return { focusIndex, setFocusIndex, resetFocus };
}
