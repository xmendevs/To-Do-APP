import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("mono-token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  // The API layer fires this when a request comes back 401 with a token
  // present (expired or revoked). Drop straight back to the landing page
  // instead of leaving the UI spinning.
  useEffect(() => {
    const onUnauthorized = () => {
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
    };
    window.addEventListener("mono:unauthorized", onUnauthorized);
    return () => window.removeEventListener("mono:unauthorized", onUnauthorized);
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch {
      localStorage.removeItem("mono-token");
      delete api.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    const { access_token } = res.data;
    localStorage.setItem("mono-token", access_token);
    api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    await fetchUser();
  };

  const register = async (username, email, password) => {
    await api.post("/auth/register", { username, email, password });
    await login(username, password);
  };

  const logout = () => {
    localStorage.removeItem("mono-token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const upgrade = async () => {
    const res = await api.post("/users/upgrade");
    setUser(res.data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, upgrade }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
