"use client";

import { useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ListMusic,
  X,
  RotateCcw,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SongArrangement } from "@/services/songs.service";
import { cn } from "@/lib/utils";

export interface PlaybackStep {
  sectionId: string;
  label: string;
  index: number;
}

interface SongStructurePlayerProps {
  arrangement: SongArrangement;
  activeStepIndex: number;
  onStepChange: (index: number) => void;
  onClose?: () => void;
  canManage?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function SongStructurePlayer({
  arrangement,
  activeStepIndex,
  onStepChange,
  onClose,
  canManage,
  onEdit,
  onDelete,
  className,
}: SongStructurePlayerProps) {
  // Expand items with repeats into individual playback steps
  const steps: PlaybackStep[] = useMemo(() => {
    const list: PlaybackStep[] = [];
    let counter = 0;

    for (const item of arrangement.items) {
      const repeat = item.repeat || 1;
      for (let r = 1; r <= repeat; r++) {
        list.push({
          sectionId: item.section,
          label: repeat > 1 ? `${item.section} (${r}/${repeat})` : item.section,
          index: counter++,
        });
      }
    }

    return list;
  }, [arrangement]);

  const currentStep = steps[activeStepIndex] || steps[0];

  const handleNext = () => {
    if (activeStepIndex < steps.length - 1) {
      onStepChange(activeStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (activeStepIndex > 0) {
      onStepChange(activeStepIndex - 1);
    }
  };

  const handleReset = () => {
    onStepChange(0);
  };

  // Smooth scroll active section into view whenever activeStepIndex changes
  useEffect(() => {
    if (!currentStep) return;

    const elementId = `section-${encodeURIComponent(currentStep.sectionId)}`;
    const el = document.getElementById(elementId);

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentStep]);

  // Keyboard navigation (Space, ArrowRight, ArrowLeft)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === " ") {
        if (activeStepIndex < steps.length - 1) {
          e.preventDefault();
          onStepChange(activeStepIndex + 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (activeStepIndex > 0) {
          e.preventDefault();
          onStepChange(activeStepIndex - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeStepIndex, steps.length, onStepChange]);

  if (!steps.length) return null;

  return (
    <div
      className={cn(
        "sticky top-16 z-30 rounded-xl border bg-card/95 backdrop-blur-md p-3 shadow-md space-y-2 animate-in fade-in slide-in-from-top-2 duration-200",
        className,
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-foreground truncate">
          <ListMusic className="size-4 text-primary shrink-0" />
          <span className="text-muted-foreground font-normal">Структура:</span>
          <span className="truncate">{arrangement.name}</span>
          <span className="text-muted-foreground font-normal ml-1 shrink-0">
            ({activeStepIndex + 1} з {steps.length})
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleReset}
            title="Почати спочатку"
            className="size-6 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" />
          </Button>

          {canManage && onEdit && (
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={onEdit}
              title="Редагувати структуру"
              className="size-6 text-muted-foreground hover:text-foreground"
            >
              <Pencil className="size-3" />
            </Button>
          )}

          {canManage && onDelete && (
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={onDelete}
              title="Видалити структуру"
              className="size-6 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3" />
            </Button>
          )}

          {onClose && (
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={onClose}
              title="Закрити програвання структури"
              className="size-6 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Steps chain */}
      <div className="flex flex-wrap items-center gap-1.5 py-1 text-xs max-h-48 overflow-y-auto">
        {steps.map((step, idx) => {
          const isActive = idx === activeStepIndex;
          const isPassed = idx < activeStepIndex;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onStepChange(idx)}
              className={cn(
                "px-2.5 py-1 rounded-full border text-xs font-semibold shrink-0 transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs scale-105"
                  : isPassed
                    ? "bg-muted/40 text-muted-foreground/80 border-border line-through"
                    : "bg-muted/20 hover:bg-muted text-foreground border-border",
              )}
            >
              {step.label}
            </button>
          );
        })}
      </div>

      {/* Controls navigation bar */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t">
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1"
          disabled={activeStepIndex === 0}
          onClick={handlePrev}
        >
          <ChevronLeft className="size-3.5" />
          Назад
        </Button>

        <div className="text-xs font-medium text-foreground text-center truncate px-2">
          {currentStep ? (
            <span className="text-primary font-bold">
              {currentStep.label}
            </span>
          ) : null}
          <span className="hidden sm:inline text-muted-foreground text-[11px] ml-2">
            (Пробіл або → для переходу)
          </span>
        </div>

        <Button
          size="sm"
          className="h-8 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={activeStepIndex === steps.length - 1}
          onClick={handleNext}
        >
          Далі
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
