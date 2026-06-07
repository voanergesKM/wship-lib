"use client";

import { init } from "@telegram-apps/sdk-react";
import {
  useEffect,
  ReactNode,
  useState,
  createContext,
  useContext,
} from "react";

const TelegramContext = createContext<{ isMock: boolean }>({ isMock: false });

export const useTelegramContext = () => useContext(TelegramContext);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    const isTelegram =
      typeof window !== "undefined" &&
      (window.location.search.includes("tgWebApp") ||
        window.location.hash.includes("tgWebApp"));

    if (!isTelegram && process.env.NODE_ENV === "development") {
      setIsMock(true);
      console.log("ℹ️ Working locally in mock mode for desktop");
      return;
    }

    try {
      init({ acceptCustomStyles: true } as any);
      setIsMock(false);
    } catch (e) {
      console.error("Failed to initialize Telegram SDK:", e);
      setIsMock(false);
    }
  }, []);

  return (
    <TelegramContext.Provider value={{ isMock }}>
      {children}
    </TelegramContext.Provider>
  );
}
