"use client";

import { useState } from "react";
import { useAuth } from "../providers/AuthContext";
import ThemeToggle from "../ToggleTheme";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { TelegramLoginWidget } from "../ui/telegram-login";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export const Header = () => {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <header className="flex sticky top-0 z-50 h-14 w-full bg-background/50 backdrop-blur-sm items-center justify-between  py-3 border-b">
      <div className="text-lg font-semibold w-full max-w-[1920px] m-auto px-4 flex gap-2 items-center justify-between">
        <div>
          <BackButton />
        </div>

        <div className="flex gap-2 items-center">
          <ThemeToggle />

          <Button
            asChild
            size="icon"
            variant="secondary"
            aria-label="Add new song"
          >
            <Link href={"/songs/new"}>
              <Plus />
            </Link>
          </Button>

          {!isLoading &&
            (isAuthenticated ? (
              <Avatar aria-label="User profile">
                <AvatarImage
                  src={user?.photoUrl || ""}
                  alt={user?.firstName || ""}
                  className="grayscale"
                />
                <AvatarFallback>{user?.firstName?.[0] || "?"}</AvatarFallback>
              </Avatar>
            ) : (
              <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Увійти
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center">
                      Авторизація
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center justify-center py-6 space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Увійдіть через Telegram, щоб отримати доступ до всіх
                      функцій.
                    </p>

                    <TelegramLoginWidget
                      botName={
                        process.env.NEXT_PUBLIC_BOT_USERNAME ||
                        "voanergesKM_bot"
                      }
                      buttonSize="large"
                      cornerRadius={8}
                      onAuth={async (telegramUser) => {
                        try {
                          const response = await fetch("/api/auth/telegram", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ widgetData: telegramUser }),
                          });
                          const data = await response.json();
                          if (data.success) {
                            setIsLoginOpen(false);
                            // Refresh auth state globally
                            await refreshUser();
                          } else {
                            console.error("Auth failed", data.error);
                          }
                        } catch (err) {
                          console.error("Login error:", err);
                        }
                      }}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            ))}
        </div>
      </div>
    </header>
  );
};

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.replace("/");
  };

  if (pathname === "/") {
    return null;
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      variant={"ghost"}
      size="icon"
      // className="text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft />
    </Button>
  );
}
