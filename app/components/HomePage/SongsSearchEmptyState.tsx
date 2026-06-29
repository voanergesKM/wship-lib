import { SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface SongsSearchEmptyStateProps {
  searchQuery?: string;
}

export const SongsSearchEmptyState = ({
  searchQuery = "",
}: SongsSearchEmptyStateProps) => {
  const normalizedSearchQuery = searchQuery.trim();
  const hasSearchQuery = normalizedSearchQuery.length > 0;

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-6" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Пісень не знайдено</h2>
        <p className="text-sm text-muted-foreground">
          {hasSearchQuery
            ? `За запитом "${normalizedSearchQuery}" немає збігів. Спробуйте змінити назву, автора або тег.`
            : "У бібліотеці поки немає пісень."}
        </p>
      </div>
      {hasSearchQuery && (
        <Button asChild variant="outline">
          <Link href="/">Скинути пошук</Link>
        </Button>
      )}
    </div>
  );
};
