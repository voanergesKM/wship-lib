"use client";

import type { ReactNode } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  isDeleting: boolean;
  onConfirm: () => void | Promise<void>;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  title,
  children,
  isDeleting,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-2 pt-2 text-left">
            {children}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Скасувати
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 data-icon="inline-start" className="animate-spin" />
                Видалення...
              </>
            ) : (
              "Видалити"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
