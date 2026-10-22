"use client";

import { Clock, Edit3, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SongPendingProposalBannerProps {
  onEdit: () => void;
  onCancel: () => void | Promise<void>;
}

export function SongPendingProposalBanner({
  onEdit,
  onCancel,
}: SongPendingProposalBannerProps) {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
      <div className="flex items-start gap-3">
        <Clock className="size-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Ваша пропозиція змін очікує на розгляд автора
          </p>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
            Ви можете переглянути або оновити запропоновані правки, або
            скасувати пропозицію.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="bg-background"
          onClick={onEdit}
        >
          <Edit3 className="size-3.5 mr-1" />
          Редагувати
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10"
          onClick={onCancel}
        >
          <X className="size-3.5 mr-1" />
          Скасувати
        </Button>
      </div>
    </div>
  );
}
