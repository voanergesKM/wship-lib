"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ListMusic,
  X,
  RotateCcw,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  readOnly?: boolean;
  isLive?: boolean;
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
  readOnly = false,
  isLive = false,
}: SongStructurePlayerProps) {
  const [isBadgesOpen, setIsBadgesOpen] = useState(false);
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

  // Map arrangement items to step ranges for compact badge rendering
  const itemSteps = useMemo(() => {
    let currentStepIndex = 0;
    const list = [];
    for (let itemIdx = 0; itemIdx < arrangement.items.length; itemIdx++) {
      const item = arrangement.items[itemIdx];
      const repeat = item.repeat || 1;
      const startIndex = currentStepIndex;
      const endIndex = currentStepIndex + repeat - 1;
      currentStepIndex += repeat;
      list.push({
        itemIdx,
        section: item.section,
        repeat,
        startIndex,
        endIndex,
      });
    }
    return list;
  }, [arrangement]);

  const currentStep = steps[activeStepIndex] || steps[0];
  const currentItem = useMemo(() => {
    return (
      itemSteps.find(
        (it) =>
          activeStepIndex >= it.startIndex && activeStepIndex <= it.endIndex,
      ) || itemSteps[0]
    );
  }, [itemSteps, activeStepIndex]);

  const handleItemClick = (item: (typeof itemSteps)[number]) => {
    if (readOnly) return;
    if (activeStepIndex >= item.startIndex && activeStepIndex <= item.endIndex) {
      // If currently active and has remaining repeats, advance to next repeat
      if (activeStepIndex < item.endIndex) {
        onStepChange(activeStepIndex + 1);
      } else {
        // If on the last repeat, cycle back to the first repeat of this section
        onStepChange(item.startIndex);
      }
    } else {
      // Jump to the start of this section
      onStepChange(item.startIndex);
    }
  };

  const handleNext = () => {
    if (readOnly) return;
    if (activeStepIndex < steps.length - 1) {
      onStepChange(activeStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (readOnly) return;
    if (activeStepIndex > 0) {
      onStepChange(activeStepIndex - 1);
    }
  };

  const handleReset = () => {
    if (readOnly) return;
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
    if (readOnly) return;

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
  }, [activeStepIndex, steps.length, onStepChange, readOnly]);

  if (!steps.length) return null;

  if (readOnly) {
    return (
      <Collapsible
        open={isBadgesOpen}
        onOpenChange={setIsBadgesOpen}
        className={cn(
          "sticky top-16 z-30 rounded-xl border bg-card/95 backdrop-blur-md px-3 py-2 shadow-md space-y-2 animate-in fade-in slide-in-from-top-2 duration-200",
          className,
        )}
      >
        {/* Compact follower header */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-foreground truncate min-w-0">
            <ListMusic className="size-4 text-primary shrink-0" />
            {isLive && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full shrink-0">
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            )}
            <span className="text-muted-foreground font-normal shrink-0 hidden sm:inline">
              Секція:
            </span>
            <span className="text-primary font-bold truncate">
              {currentItem && currentItem.repeat > 1 ? (
                <>
                  <span>{currentItem.section}</span>
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    ({activeStepIndex - currentItem.startIndex + 1}/{currentItem.repeat})
                  </span>
                </>
              ) : (
                currentStep?.sectionId
              )}
            </span>
            <span className="text-muted-foreground font-normal text-[11px] shrink-0">
              ({activeStepIndex + 1}/{steps.length})
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <CollapsibleTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[11px] font-normal text-muted-foreground hover:text-foreground gap-1 border-muted-foreground/20"
              >
                <span>Структура</span>
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform duration-200",
                    isBadgesOpen && "rotate-180",
                  )}
                />
              </Button>
            </CollapsibleTrigger>

            {onClose && (
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={onClose}
                title="Закрити структуру"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Expandable badges list for followers */}
        <CollapsibleContent className="pt-2 border-t space-y-1">
          <p className="text-[11px] text-muted-foreground font-medium">
            Послідовність пісні:
          </p>
          <div className="flex flex-wrap items-center gap-1.5 py-1 text-xs max-h-36 overflow-y-auto">
            {itemSteps.map((item) => {
              const isActive =
                activeStepIndex >= item.startIndex && activeStepIndex <= item.endIndex;
              const isPassed = activeStepIndex > item.endIndex;
              const currentRepeat = isActive
                ? activeStepIndex - item.startIndex + 1
                : 1;

              let label = item.section;
              if (item.repeat > 1) {
                label = isActive
                  ? `${item.section} · ${currentRepeat}/${item.repeat}`
                  : `${item.section} ×${item.repeat}`;
              }

              return (
                <span
                  key={item.itemIdx}
                  title={
                    item.repeat > 1
                      ? `${item.section} (${item.repeat} повтори)`
                      : item.section
                  }
                  className={cn(
                    "px-2.5 py-0.5 rounded-full border text-xs font-semibold shrink-0 select-none transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-xs scale-105"
                      : isPassed
                        ? "bg-muted/40 text-muted-foreground/70 border-border line-through"
                        : "bg-muted/20 text-muted-foreground border-border",
                  )}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

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
          {isLive && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full shrink-0">
              <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!readOnly && (
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={handleReset}
              title="Почати спочатку"
              className="size-6 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3" />
            </Button>
          )}

          {!readOnly && canManage && onEdit && (
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

          {!readOnly && canManage && onDelete && (
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
        {itemSteps.map((item) => {
          const isActive =
            activeStepIndex >= item.startIndex && activeStepIndex <= item.endIndex;
          const isPassed = activeStepIndex > item.endIndex;
          const currentRepeat = isActive
            ? activeStepIndex - item.startIndex + 1
            : 1;

          let label = item.section;
          if (item.repeat > 1) {
            label = isActive
              ? `${item.section} · ${currentRepeat}/${item.repeat}`
              : `${item.section} ×${item.repeat}`;
          }

          return (
            <button
              key={item.itemIdx}
              type="button"
              disabled={readOnly}
              onClick={() => handleItemClick(item)}
              title={
                item.repeat > 1
                  ? isActive
                    ? `Повтор ${currentRepeat} з ${item.repeat}. Натисніть для переходу на наступний повтор`
                    : `${item.section} (${item.repeat} повтори)`
                  : item.section
              }
              className={cn(
                "px-2.5 py-1 rounded-full border text-xs font-semibold shrink-0 transition-all duration-200 select-none",
                readOnly ? "cursor-default" : "cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs scale-105"
                  : isPassed
                    ? "bg-muted/40 text-muted-foreground/80 border-border line-through"
                    : "bg-muted/20 hover:bg-muted text-foreground border-border",
              )}
            >
              {label}
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
          disabled={readOnly || activeStepIndex === 0}
          onClick={handlePrev}
        >
          <ChevronLeft className="size-3.5" />
          Назад
        </Button>

        <div className="text-xs font-medium text-foreground text-center truncate px-2">
          {currentStep ? (
            <span className="text-primary font-bold">
              {currentItem && currentItem.repeat > 1 ? (
                <>
                  <span>{currentItem.section}</span>
                  <span className="text-xs font-medium text-muted-foreground ml-1.5">
                    (повтор {activeStepIndex - currentItem.startIndex + 1} з{" "}
                    {currentItem.repeat})
                  </span>
                </>
              ) : (
                currentStep.sectionId
              )}
            </span>
          ) : null}
          {!readOnly && (
            <span className="hidden sm:inline text-muted-foreground text-[11px] ml-2">
              (Пробіл або → для переходу)
            </span>
          )}
        </div>

        <Button
          size="sm"
          className="h-8 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={readOnly || activeStepIndex === steps.length - 1}
          onClick={handleNext}
        >
          Далі
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
