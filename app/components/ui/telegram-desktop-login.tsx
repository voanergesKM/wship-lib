"use client";

import { useEffect, useState } from "react";
import { Button } from "./button";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface TelegramDesktopLoginProps {
  botName: string;
  onAuth: () => void;
}

export function TelegramDesktopLogin({
  botName,
  onAuth,
}: TelegramDesktopLoginProps) {
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let isActive = true;

    const initAuth = async () => {
      try {
        const res = await fetch("/api/auth/telegram/desktop/generate");
        const data = await res.json();
        
        if (data.success && isActive) {
          setAuthCode(data.code);
          setLoading(false);
        } else {
          throw new Error("Failed to generate code");
        }
      } catch (err) {
        if (isActive) {
          setError("Помилка ініціалізації авторизації.");
          setLoading(false);
        }
      }
    };

    initAuth();

    // Poll for status
    interval = setInterval(async () => {
      if (!authCode) return;

      try {
        const res = await fetch(`/api/auth/telegram/desktop/status?code=${authCode}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.success && data.status === "completed") {
          clearInterval(interval);
          if (isActive) onAuth();
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 2500);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [authCode, onAuth]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Підготовка...</p>
      </div>
    );
  }

  if (error || !authCode) {
    return (
      <div className="text-center text-sm text-red-500 p-4">
        {error || "Не вдалося згенерувати код."}
      </div>
    );
  }

  const telegramLink = `https://t.me/${botName}?start=${authCode}`;

  return (
    <div className="flex flex-col items-center justify-center space-y-4 w-full">
      <Button
        asChild
        className="w-full bg-[#2481cc] hover:bg-[#1d6fae] text-white"
      >
        <Link href={telegramLink} target="_blank" rel="noopener noreferrer">
          <svg
            className="w-5 h-5 mr-2"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.667 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          Відкрити Telegram
        </Link>
      </Button>
      <p className="text-xs text-muted-foreground text-center px-4">
        Натисніть кнопку, щоб перейти в бота. Натисніть "Start" (або "Розпочати") у боті для підтвердження.
      </p>
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Очікування підтвердження...</span>
      </div>
    </div>
  );
}
