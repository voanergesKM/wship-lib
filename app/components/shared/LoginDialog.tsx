"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TelegramDesktopLogin } from "@/components/ui/telegram-desktop-login";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  onAuth: () => void | Promise<void>;
}

export function LoginDialog({
  open,
  onOpenChange,
  description,
  onAuth,
}: LoginDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Авторизація</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-4">
          <TelegramDesktopLogin
            botName={process.env.NEXT_PUBLIC_BOT_USERNAME || "voanergesKM_bot"}
            onAuth={onAuth}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
