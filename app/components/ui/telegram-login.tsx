"use client";

import { useEffect, useRef } from "react";

interface TelegramLoginWidgetProps {
  botName: string;
  buttonSize?: "large" | "medium" | "small";
  cornerRadius?: number;
  requestAccess?: "write";
  usePic?: boolean;
  onAuth: (user: any) => void;
}

export function TelegramLoginWidget({
  botName,
  buttonSize = "large",
  cornerRadius,
  requestAccess = "write",
  usePic = true,
  onAuth,
}: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear the container in case of re-renders
    containerRef.current.innerHTML = "";

    // Set up the callback globally
    (window as any).onTelegramAuth = (user: any) => {
      onAuth(user);
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", buttonSize);
    
    if (cornerRadius !== undefined) {
      script.setAttribute("data-radius", cornerRadius.toString());
    }
    
    if (requestAccess) {
      script.setAttribute("data-request-access", requestAccess);
    }

    script.setAttribute("data-userpic", usePic.toString());
    script.setAttribute("data-onauth", "onTelegramAuth(user)");

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      delete (window as any).onTelegramAuth;
    };
  }, [botName, onAuth, buttonSize, cornerRadius, requestAccess, usePic]);

  return <div ref={containerRef} className="flex justify-center" />;
}
