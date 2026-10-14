"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SongSheet } from "./SongSheet";
import { Check, CircleHelp, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ⚠️ СИНХРОНІЗАЦІЯ З ПАРСЕРОМ:
 * Цей компонент відображає інструкцію та приклади для синтаксису парсера пісень:
 * 👉 file:///app/utils/parseSong.ts
 *
 * Якщо ви оновлюєте або розширюєте парсер у parseSong.ts, ОБОВ'ЯЗКОВО
 * актуалізуйте правила та приклад у цьому файлі.
 */

export const EXAMPLE_SONG_MARKUP = `<section id="Вступ">
[Am] [F] [C] [G]
</section>

<section id="1 куплет">
[Am]Славте Госпо[F]да, бо Він [C]добрий,
[Dm]Бо навіки [E]милість Його!
</section>

<section id="Приспів">
@center
## Приспів
[F]Али[G]луя, [Am]алилуя,
[F]Бо навіки [E]милість Його!
### x2
</section>

<section id="2 куплет">
[Am]Хай скаже дім [F]Ізраїля нині:
[Dm]«Бо навіки [E]милість Його!»
</section>`;

export type SongFormatGuideDialogProps = {
  triggerClassName?: string;
  dialogTrigger?: React.ReactNode;
};

export function SongFormatGuideDialog({
  triggerClassName,
  dialogTrigger,
}: SongFormatGuideDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(EXAMPLE_SONG_MARKUP);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Не вдалося скопіювати приклад:", err);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {dialogTrigger || (
          <Button
            type="button"
            size="icon"
            variant="outline"
            title="Інструкція з розмітки тексту та акордів"
            className={cn("bg-background", triggerClassName)}
          >
            <CircleHelp className="size-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-3xl w-full max-h-[90dvh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-bold">
            Інструкція з розмітки тексту пісні
          </DialogTitle>
          <DialogDescription>
            Правила запису акордів, блоків секцій, заголовків та тегів вирівнювання для коректного відображення парсером.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="rules" className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TabsList className="grid grid-cols-2 w-full shrink-0">
            <TabsTrigger value="rules">Правила та теги</TabsTrigger>
            <TabsTrigger value="example">Живий приклад</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="flex-1 overflow-y-auto pr-1 space-y-4 mt-3">
            {/* Теги секцій <section> */}
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                    &lt;section id=&quot;...&quot;&gt;
                  </span>
                  Блоки секцій (куплети, приспіви)
                </h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Обгортайте логічні блоки пісні в теги <code className="font-mono font-bold">&lt;section id=&quot;Назва&quot;&gt; ... &lt;/section&gt;</code>. Це дає змогу відображати пісню у вигляді адаптивної сітки (Grid), створювати структуру пісні (порядок куплетної форми) та програвати пісню зі скролом:
              </p>
              <div className="rounded-lg bg-muted/60 p-2.5 font-mono text-xs text-foreground whitespace-pre">
{`<section id="1 куплет">
[Am]Славте Госпо[F]да, бо Він [C]добрий,
[Dm]Бо навіки [E]милість Його!
</section>`}
              </div>
              <p className="text-xs text-muted-foreground">
                • Назва секції (наприклад, <code>1 куплет</code>, <code>1к</code>, <code>Приспів</code>, <code>Брідж</code>) використовується в конструкторі структури пісні.
              </p>
            </div>

            {/* Акорди */}
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                    [Акорд]
                  </span>
                  Акорди в тексті
                </h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Акорди записуються у квадратних дужках безпосередньо перед словом або складом, над яким вони мають звучати:
              </p>
              <div className="rounded-lg bg-muted/60 p-2.5 font-mono text-xs text-foreground">
                [Am]Славте Госпо[F]да, бо Він [C]добрий
              </div>
              <p className="text-xs text-muted-foreground">
                • Для програшів та вступів без слів записуйте акорди через пробіл:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono">[Am] [F] [C] [G]</code>
              </p>
            </div>

            {/* Заголовки секцій */}
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <h4 className="font-semibold text-base flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  # ## ###
                </span>
                Заголовки та ремарки
              </h4>
              <p className="text-sm text-muted-foreground">
                Використовуйте знаки решітки на початку рядка для текстових підзаголовків:
              </p>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="rounded-lg bg-muted/60 p-2 flex items-center justify-between">
                  <span># Куплет 1</span>
                  <span className="text-muted-foreground font-sans text-[11px]">Головний заголовок (h1, жирний)</span>
                </div>
                <div className="rounded-lg bg-muted/60 p-2 flex items-center justify-between">
                  <span>## Приспів / Бридж / Вступ</span>
                  <span className="text-muted-foreground font-sans text-[11px]">Підзаголовок секції (h2, жирний)</span>
                </div>
                <div className="rounded-lg bg-muted/60 p-2 flex items-center justify-between">
                  <span>### x2 / Модуляція / Тихо</span>
                  <span className="text-muted-foreground font-sans text-[11px]">Ремарка до секції (h3, курсив)</span>
                </div>
              </div>
            </div>

            {/* Теги вирівнювання */}
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <h4 className="font-semibold text-base flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  @теги
                </span>
                Вирівнювання тексту
              </h4>
              <p className="text-sm text-muted-foreground">
                Тег на окремому рядку змінює вирівнювання для всіх наступних рядків пісні:
              </p>
              <div className="grid sm:grid-cols-3 gap-2 font-mono text-xs">
                <div className="rounded-lg bg-muted/60 p-2.5">
                  <div className="font-bold text-foreground">@center</div>
                  <div className="text-muted-foreground font-sans text-[11px] mt-1">
                    По центру (ідеально для приспіву)
                  </div>
                </div>
                <div className="rounded-lg bg-muted/60 p-2.5">
                  <div className="font-bold text-foreground">@left</div>
                  <div className="text-muted-foreground font-sans text-[11px] mt-1">
                    По лівому краю (за замовчуванням)
                  </div>
                </div>
                <div className="rounded-lg bg-muted/60 p-2.5">
                  <div className="font-bold text-foreground">@right</div>
                  <div className="text-muted-foreground font-sans text-[11px] mt-1">
                    По правому краю
                  </div>
                </div>
              </div>
            </div>

            {/* Інтервали та порожні рядки */}
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <h4 className="font-semibold text-base">Порожні рядки</h4>
              <p className="text-sm text-muted-foreground">
                Порожній рядок між блоками тексту створює зручний вертикальний відступ між куплетами та секціями пісні.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="example" className="flex-1 overflow-y-auto pr-1 space-y-4 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Приклад розмітки та живий результат рендеру парсером:
              </span>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleCopy}
                className="gap-1.5"
              >
                {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                {copied ? "Скопійовано!" : "Скопіювати шаблон"}
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground">Вхідний текст (розмітка):</span>
                <pre className="rounded-xl border bg-muted/40 p-3 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed select-all">
                  {EXAMPLE_SONG_MARKUP}
                </pre>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground">Результат (як бачить користувач):</span>
                <div className="rounded-xl border bg-card p-4 max-h-96 overflow-y-auto">
                  <SongSheet content={EXAMPLE_SONG_MARKUP} fontSize={13} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
