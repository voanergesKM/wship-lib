"use client";

import { useAuth } from "../providers/AuthContext";
import ThemeToggle from "../ToggleTheme";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

export const Header = () => {
  const { user } = useAuth();
  return (
    <header className="flex sticky top-0 z-50 h-14 w-full bg-background/50 backdrop-blur-sm items-center justify-between  py-3 border-b">
      <div className="text-lg font-semibold w-full max-w-[1920px] m-auto px-4 flex gap-2 items-center justify-between">
        <span />
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

          <Avatar aria-label="User profile">
            <AvatarImage
              src={user?.photoUrl || ""}
              alt={user?.firstName || ""}
              className="grayscale"
            />
            <AvatarFallback>{user?.firstName?.[0] || "?"}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};
