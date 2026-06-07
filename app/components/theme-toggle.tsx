"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "../hooks/use-theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-md transition-colors ${
          theme === "light"
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        }`}
        title="Світла тема"
      >
        <Sun className="w-5 h-5" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-md transition-colors ${
          theme === "dark"
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        }`}
        title="Темна тема"
      >
        <Moon className="w-5 h-5" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-2 rounded-md transition-colors ${
          theme === "system"
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        }`}
        title="Системна тема"
      >
        <Monitor className="w-5 h-5" />
      </button>
    </div>
  );
}
