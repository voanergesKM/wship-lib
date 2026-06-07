"use client";

import { useTheme as useNextTheme } from "next-themes";

export function useTheme() {
  const { theme, setTheme, systemTheme } = useNextTheme();

  const effectiveTheme = theme === "system" ? systemTheme : theme;

  return { theme, setTheme, effectiveTheme };
}
