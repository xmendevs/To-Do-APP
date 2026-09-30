import axios from "axios";

/**
 * Base URL for API calls.
 *
 * Dev:  Vite proxies /api/* -> http://localhost:8000 (see vite.config.js),
 *       so the default "/api" works with no configuration.
 *
 * Prod: set VITE_API_URL to the deployed backend origin, e.g.
 *       https://mono-todo-api.onrender.com
 *       Note: no trailing slash and no /api suffix - the FastAPI routes are
 *       mounted at the root (/auth/login, /tasks, ...).
 */
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "/api"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mono-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // An expired/invalid token should drop the user back to the login screen
    // rather than leaving the UI stuck on "Loading...".
    if (err.response?.status === 401 && localStorage.getItem("mono-token")) {
      localStorage.removeItem("mono-token");
      window.dispatchEvent(new Event("mono:unauthorized"));
    }
    return Promise.reject(err);
  }
);

export default api;
