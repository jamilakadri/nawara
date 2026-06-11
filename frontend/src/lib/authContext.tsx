"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, authToken: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

function getDashboardPath(role: string): string {
  if (role === "ADMINRH") return "/admin";
  if (role === "MANAGER") return "/manager";
  return "/employee";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const pendingRedirect = useRef<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const publicRoutes = ["/login"];
    const isPublic = publicRoutes.includes(pathname);

    if (!user) {
      if (!isPublic) router.replace("/login");
      return;
    }

    if (pendingRedirect.current) {
      const dest = pendingRedirect.current;
      pendingRedirect.current = null;
      router.replace(dest);
      return;
    }

    if (isPublic) {
      router.replace(getDashboardPath(user.role));
      return;
    }

    const wrongAdmin    = pathname.startsWith("/admin")    && user.role !== "ADMINRH";
    const wrongManager  = pathname.startsWith("/manager")  && user.role !== "MANAGER" && user.role !== "ADMINRH";
    const wrongEmployee = pathname.startsWith("/employee") && user.role !== "SALARIE";

    if (wrongAdmin || wrongManager || wrongEmployee) {
      router.replace(getDashboardPath(user.role));
    }
  }, [user, pathname, isLoading, router]);

  const login = (userData: User, authToken: string) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
    pendingRedirect.current = getDashboardPath(userData.role);
    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}