import Link from "next/link";
import { Button } from "@/components/ui/button";
export function AdminPagination({
  path,
  page,
  pages,
  search,
}: {
  path: string;
  page: number;
  pages: number;
  search: Record<string, string | undefined>;
}) {
  if (pages <= 1) return null;
  const href = (value: number) => {
    const params = new URLSearchParams();
    for (const [key, entry] of Object.entries(search))
      if (entry) params.set(key, entry);
    params.set("page", String(value));
    return `${path}?${params}`;
  };
  return (
    <nav
      aria-label="Сторінки результатів"
      className="flex items-center justify-between gap-3"
    >
      {page > 1 ? (
        <Button asChild variant="outline">
          <Link href={href(page - 1)}>Назад</Link>
        </Button>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted-foreground">
        {page} / {pages}
      </span>
      {page < pages ? (
        <Button asChild variant="outline">
          <Link href={href(page + 1)}>Далі</Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  );
}
