"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  X,
  ListMusic,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrangementItem,
  CreateArrangementPayload,
  SongArrangement,
} from "@/services/songs.service";
import { extractSongSections } from "@/utils/parseSong";

interface SongArrangementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: string;
  arrangement?: SongArrangement | null;
  onSave: (payload: CreateArrangementPayload) => Promise<void>;
  isSaving?: boolean;
}

export function SongArrangementDialog({
  open,
  onOpenChange,
  document,
  arrangement,
  onSave,
  isSaving = false,
}: SongArrangementDialogProps) {
  const [name, setName] = useState(arrangement?.name || "Основна");
  const [items, setItems] = useState<ArrangementItem[]>(arrangement?.items || []);
  const [customSection, setCustomSection] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (arrangement) {
        setName(arrangement.name);
        setItems(arrangement.items || []);
      } else {
        setName("Основна");
        setItems([]);
      }
      setCustomSection("");
      setError(null);
    }
  }, [open, arrangement]);

  // Available sections parsed from the song
  const parsedSections = useMemo(
    () => extractSongSections(document),
    [document],
  );

  // Add a section to the arrangement sequence
  const handleAddSection = (sectionName: string) => {
    setError(null);
    setItems((prev) => {
      if (prev.length === 0) {
        return [{ section: sectionName, repeat: 1 }];
      }

      const lastIndex = prev.length - 1;
      const lastItem = prev[lastIndex];

      // If consecutive section is the same, increment repeat (e.g. 1к -> 1к-2р)
      if (lastItem.section.toLowerCase() === sectionName.toLowerCase()) {
        const updated = [...prev];
        updated[lastIndex] = {
          ...lastItem,
          repeat: lastItem.repeat + 1,
        };
        return updated;
      }

      // Otherwise append new item
      return [...prev, { section: sectionName, repeat: 1 }];
    });
  };

  const handleAddCustomSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSection.trim()) return;
    handleAddSection(customSection.trim());
    setCustomSection("");
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIncrementRepeat = (index: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], repeat: updated[index].repeat + 1 };
      return updated;
    });
  };

  const handleDecrementRepeat = (index: number) => {
    setItems((prev) => {
      const updated = [...prev];
      if (updated[index].repeat <= 1) {
        return prev.filter((_, i) => i !== index);
      }
      updated[index] = { ...updated[index], repeat: updated[index].repeat - 1 };
      return updated;
    });
  };

  const handleClear = () => {
    setItems([]);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Вкажіть назву структури");
      return;
    }

    if (items.length === 0) {
      setError("Додайте хоча б один блок до структури пісні");
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        items,
      });
      onOpenChange(false);
      setName("Основна");
      setItems([]);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Не вдалося зберегти структуру",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-full max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ListMusic className="size-5 text-primary" />
            {arrangement ? "Редагування структури пісні" : "Конструктор структури пісні"}
          </DialogTitle>
          <DialogDescription>
            {arrangement
              ? "Змініть назву або послідовність блоків структури пісні."
              : "Клікайте по бейджах секцій, щоб сформувати порядок виконання пісні (повтори групуються автоматично)."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6 pt-2">
          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="arr-name">Назва структури</Label>
            <Input
              id="arr-name"
              placeholder="Наприклад: Основна, Для неділі, Скорочена..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Available Sections Badges */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              Доступні секції з пісні (клікніть, щоб додати):
            </Label>
            <div className="flex flex-wrap gap-2 p-3 rounded-xl border bg-muted/20">
              {parsedSections.length > 0 ? (
                parsedSections.map((sec) => (
                  <Button
                    key={sec}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="font-medium bg-background hover:bg-primary hover:text-primary-foreground transition-all duration-150"
                    onClick={() => handleAddSection(sec)}
                  >
                    <Plus className="size-3.5 mr-1 text-primary group-hover:text-inherit" />
                    {sec}
                  </Button>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  У тексті пісні не знайдено тегів &lt;section id=&quot;...&quot;&gt;.
                  Ви можете додавати блоки вручну нижче.
                </p>
              )}
            </div>

            {/* Custom section input */}
            <div className="flex items-center gap-2 pt-1">
              <Input
                placeholder="Свій блок (напр. Соло, Вступ...)"
                value={customSection}
                onChange={(e) => setCustomSection(e.target.value)}
                className="h-8 text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 text-xs shrink-0"
                onClick={handleAddCustomSection}
                disabled={!customSection.trim()}
              >
                <Plus className="size-3.5 mr-1" />
                Додати блок
              </Button>
            </div>
          </div>

          {/* Constructed Structure Sequence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-sm">
                Послідовність виконання ({items.length} блоків):
              </Label>
              {items.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="text-xs text-muted-foreground hover:text-destructive gap-1"
                  onClick={handleClear}
                >
                  <RotateCcw className="size-3" />
                  Очистити
                </Button>
              )}
            </div>

            <div className="min-h-24 p-4 rounded-xl border border-dashed bg-card/60 flex flex-wrap gap-2 items-center content-start">
              {items.length === 0 ? (
                <div className="w-full text-center py-4 text-xs text-muted-foreground">
                  Натискайте на бейджі секцій вище, щоб додати їх до структури.
                </div>
              ) : (
                items.map((item, idx) => {
                  const label =
                    item.repeat > 1
                      ? `${item.section} - ${item.repeat}р`
                      : item.section;

                  return (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-foreground shadow-2xs group animate-in zoom-in-95 duration-150"
                    >
                      <span>{label}</span>

                      <div className="inline-flex items-center gap-0.5 ml-1">
                        <button
                          type="button"
                          onClick={() => handleDecrementRepeat(idx)}
                          className="size-4 flex items-center justify-center rounded-full hover:bg-primary/20 text-muted-foreground hover:text-foreground text-[10px]"
                          title="Зменшити кількість повторень"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleIncrementRepeat(idx)}
                          className="size-4 flex items-center justify-center rounded-full hover:bg-primary/20 text-muted-foreground hover:text-foreground text-[10px]"
                          title="Збільшити кількість повторень"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="size-4 flex items-center justify-center rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive ml-0.5"
                          title="Видалити"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Скасувати
            </Button>
            <Button type="submit" disabled={isSaving || items.length === 0}>
              {arrangement ? "Зберегти зміни" : "Зберегти структуру"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
