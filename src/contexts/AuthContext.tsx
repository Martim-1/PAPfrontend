import React, { createContext, useContext, useEffect, useState } from "react";
import { loginUser, API_URL } from "@/api";
import { User } from "@/data/types";

const decodeTokenPayload = (token: string): Partial<User> | null => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return { id: decoded.id, email: decoded.email, role: decoded.role } as Partial<User>;
  } catch {
    return null;
  }
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 AUTO LOGIN AO DAR F5
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) throw new Error();

        const data = await res.json();
        setUser(data);
        setLoading(false);
      } catch (error) {
        clearTimeout(timeoutId);
        // Se foi timeout/erro de rede, mantém o utilizador logado com dados do token
        const isNetworkError = (error as Error)?.name === 'AbortError' || (error as Error)?.message?.includes('fetch');
        if (isNetworkError) {
          const partial = decodeTokenPayload(token);
          if (partial) {
            setUser(partial as User);
            setLoading(false);
            return;
          }
        }
        localStorage.removeItem("token");
        setUser(null);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUser(data);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const data = await loginUser(email, password);
      localStorage.setItem("token", data.token);
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    const token = localStorage.getItem("token");
    try {
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }

    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro do AuthProvider");
  return context;
}
