"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { UserPreferences } from "@/types/user-preferences";

export interface AuthUser {
  id: string;
  telegramId: string;
  firstName: string;
  username: string | null;
  role: string;
  photoUrl: string | null;
  email?: string | null;
  preferences: UserPreferences;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  refreshUser: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return null;
        const json = await res.json();
        return json.authenticated ? (json.user as AuthUser) : null;
      } catch (err) {
        console.error("Failed to fetch auth session:", err);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const user = data ?? null;

  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["authMe"] });
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      queryClient.setQueryData(["authMe"], null);
      window.location.href = "/";
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  }, [queryClient]);

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      refreshUser,
      logout,
    }),
    [user, isLoading, refreshUser, logout]
  );

  return (
    <AuthContext value={contextValue}>
      {children}
    </AuthContext>
  );
}
