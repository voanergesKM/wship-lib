"use client";

import { MoonIcon, Sun } from "lucide-react";

import { useTheme } from "@/hooks/useTheme";

import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      id="toggleThemeButton"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      variant="secondary"
      size="icon"
      className="relative"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />

      <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
