"use client";

import { init } from "@telegram-apps/sdk-react";
import {
  ReactNode,
  createContext,
  useContext,
  useSyncExternalStore,
} from "react";

const TelegramContext = createContext<{ isMock: boolean }>({ isMock: false });

export const useTelegramContext = () => useContext(TelegramContext);

/**
 * Determines and initialises the Telegram environment on the first client
 * render.  Uses useSyncExternalStore so the value is set synchronously
 * during hydration rather than in a useEffect (which would cause an extra
 * render and trigger the react-hooks/set-state-in-effect lint rule).
 */
// Stable "subscribe" that never notifies – the value is computed once and
// never changes after mount, so no re-subscriptions are needed.
const neverSubscribe = () => () => {};

function useIsMock(): boolean {
  return useSyncExternalStore(
    neverSubscribe,
    // Client snapshot: computed and SDK initialised exactly once.
    () => {
      const isTelegram =
        window.location.search.includes("tgWebApp") ||
        window.location.hash.includes("tgWebApp");

      if (!isTelegram && process.env.NODE_ENV === "development") {
        console.log("ℹ️ Working locally in mock mode for desktop");
        return true;
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        init({ acceptCustomStyles: true } as any);
      } catch (e) {
        console.error("Failed to initialize Telegram SDK:", e);
      }

      return false;
    },
    // Server snapshot: always false (no Telegram environment on the server).
    () => false
  );
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const isMock = useIsMock();

  return (
    <TelegramContext value={{ isMock }}>
      {children}
    </TelegramContext>
  );
}
