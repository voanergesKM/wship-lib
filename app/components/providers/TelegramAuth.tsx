"use client";

import { useEffect, useRef } from "react";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { useTelegramContext } from "./TelegramProvider";
import { useAuth } from "./AuthContext";

export default function TelegramAuth() {
  // const { isMock } = useTelegramContext();
  const { isAuthenticated, refreshUser } = useAuth();
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (isAuthenticated || hasAttempted.current) return;

    try {
      let initDataRaw = "";

      try {
        const launchParams = retrieveLaunchParams();
        initDataRaw = launchParams.initDataRaw?.toString() || "";
      } catch (e) {
        console.warn("Failed to read data from retrieveLaunchParams");
      }

      if (!initDataRaw && typeof window !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        initDataRaw = searchParams.get("tgWebAppData") || "";
        if (!initDataRaw && window.location.hash) {
          const cleanHash = window.location.hash
            .replace(/^#/, "")
            .replace(/^\?/, "");
          const hashParams = new URLSearchParams(cleanHash);
          initDataRaw = hashParams.get("tgWebAppData") || "";
        }
      }

      if (initDataRaw) {
        hasAttempted.current = true;

        const authenticateUser = async () => {
          try {
            const baseUrl =
              typeof window !== "undefined" ? window.location.origin : "";
            const response = await fetch(`${baseUrl}/api/auth/telegram`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ initData: initDataRaw }),
            });

            const contentType = response.headers.get("content-type");
            if (response.ok && contentType?.includes("application/json")) {
              const data = await response.json();
              if (data.success) {
                await refreshUser();
                console.log("✅ [Bg Auth]: Telegram authentication successful");
              }
            }
          } catch (err) {
            console.error("❌ [Bg Auth]: Background request failed", err);
          }
        };

        authenticateUser();
      }
    } catch (e) {
      console.error("❌ [Bg Auth]: Failed to initialize", e);
    }
  }, [isAuthenticated, refreshUser]);

  return null;
}
