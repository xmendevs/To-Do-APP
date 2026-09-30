import { useEffect, useRef, useCallback } from "react";

/**
 * WebSocket hook for real-time task notifications.
 * @param {string} userId - The user's ID for the WebSocket connection
 * @param {Function} onMessage - Callback when a notification is received
 */
export function useTaskNotifications(userId, onMessage) {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!userId) return;

    const wsUrl = `ws://localhost:8000/ws/notifications/${userId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected, reconnecting in 5s...");
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      ws.close();
    };

    wsRef.current = ws;
  }, [userId, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);
}
