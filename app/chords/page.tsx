import type { Metadata } from "next";
import { ChordCatalog } from "./_components/ChordCatalog";

export const metadata: Metadata = {
  title: "Каталог акордів | Worship Library",
  description: "Гітарні аплікатури: базові та джазові акорди й різні позиції на грифі.",
};

export default function ChordsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Каталог акордів</h1>
        <p className="text-muted-foreground">
          Знайдіть нове звучання: оберіть тоніку, дослідіть джазові акорди й спробуйте різні позиції на грифі.
        </p>
        <p className="text-sm text-muted-foreground">
          Стандартний стрій E–A–D–G–B–E, без каподастра. × — не грати, ○ — відкрита струна.
          Номер ліворуч від схеми позначає перший показаний лад.
        </p>
      </div>
      <ChordCatalog />
    </div>
  );
}
