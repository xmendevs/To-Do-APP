import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function UserGreeting() {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  return (
    <div className="flex items-baseline gap-3">
      <h2 className="text-lg font-medium">
        {getGreeting()}, {user.username}
      </h2>
      <span className="text-sm text-mono-400 font-mono">
        {formatTime(time)}
      </span>
    </div>
  );
}
