"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "./api";

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
}

interface AuthState {
  token: string | null;
  email: string | null;
  role: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<{ role: string | null }>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("katalis_token");
    if (stored) {
      const payload = decodeJwt(stored);
      if (payload && payload.exp * 1000 > Date.now()) {
        setToken(stored);
      } else {
        localStorage.removeItem("katalis_token");
      }
    }
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken } = await api.login(email, password);
    localStorage.setItem("katalis_token", accessToken);
    setToken(accessToken);
    return { role: decodeJwt(accessToken)?.role ?? null };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("katalis_token");
    setToken(null);
  }, []);

  const value = useMemo<AuthState>(() => {
    const payload = token ? decodeJwt(token) : null;
    return {
      token,
      email: payload?.email ?? null,
      role: payload?.role ?? null,
      ready,
      login,
      logout,
    };
  }, [token, ready, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
