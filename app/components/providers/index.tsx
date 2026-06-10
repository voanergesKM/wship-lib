"use client";

import { AuthProvider } from "./AuthContext";
import TelegramAuth from "./TelegramAuth";
import { TelegramProvider } from "./TelegramProvider";
import { ThemeProvider } from "./ThemeProvider";
import { getQueryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

const Providers = ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TelegramProvider>
          <AuthProvider>
            <TelegramAuth />

            {children}
          </AuthProvider>
        </TelegramProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default Providers;
