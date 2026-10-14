"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export interface ResponsivePaginationProps {
  currentPage: number;
  totalPages: number;
  createPageURL: (page: number) => string;
  className?: string;
  previousLabel?: string;
  nextLabel?: string;
}

type PageItem =
  | { type: "page"; page: number; isSibling?: boolean }
  | { type: "ellipsis"; key: string };

function getPaginationRange(
  currentPage: number,
  totalPages: number,
): PageItem[] {
  if (totalPages <= 1) return [];

  // If 5 or fewer pages, show all pages directly without ellipsis
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => ({
      type: "page",
      page: i + 1,
      isSibling: false,
    }));
  }

  const items: PageItem[] = [];

  // Always show first page
  items.push({ type: "page", page: 1, isSibling: false });

  // Left ellipsis or page 2
  if (currentPage > 3) {
    items.push({ type: "ellipsis", key: "ellipsis-start" });
  } else if (currentPage === 3) {
    items.push({ type: "page", page: 2, isSibling: false });
  }

  // Siblings around current page
  if (currentPage > 1 && currentPage < totalPages) {
    if (currentPage > 2 && currentPage - 1 > 1) {
      items.push({ type: "page", page: currentPage - 1, isSibling: true });
    }
    items.push({ type: "page", page: currentPage, isSibling: false });
    if (currentPage < totalPages - 1 && currentPage + 1 < totalPages) {
      items.push({ type: "page", page: currentPage + 1, isSibling: true });
    }
  } else if (currentPage === 1) {
    items.push({ type: "page", page: 2, isSibling: false });
    items.push({ type: "page", page: 3, isSibling: true });
  } else if (currentPage === totalPages) {
    items.push({ type: "page", page: totalPages - 2, isSibling: true });
    items.push({ type: "page", page: totalPages - 1, isSibling: false });
  }

  // Right ellipsis or second to last page
  if (currentPage < totalPages - 2) {
    items.push({ type: "ellipsis", key: "ellipsis-end" });
  } else if (currentPage === totalPages - 2) {
    items.push({ type: "page", page: totalPages - 1, isSibling: false });
  }

  // Always show last page
  items.push({ type: "page", page: totalPages, isSibling: false });

  // Deduplicate pages in case of boundary overlaps
  const seen = new Set<number>();
  const dedupedItems: PageItem[] = [];
  for (const item of items) {
    if (item.type === "page") {
      if (!seen.has(item.page)) {
        seen.add(item.page);
        dedupedItems.push(item);
      }
    } else {
      dedupedItems.push(item);
    }
  }

  return dedupedItems;
}

export const ResponsivePagination = ({
  currentPage,
  totalPages,
  createPageURL,
  className,
  previousLabel = "Попередня",
  nextLabel = "Наступна",
}: ResponsivePaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const items = getPaginationRange(currentPage, totalPages);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className={cn("flex flex-col items-center gap-2 w-full", className)}>
      <Pagination>
        <PaginationContent className="gap-1 sm:gap-1.5 flex-wrap justify-center">
          <PaginationItem>
            <PaginationPrevious
              href={hasPrevious ? createPageURL(currentPage - 1) : undefined}
              className={!hasPrevious ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {items.map((item) => {
            if (item.type === "ellipsis") {
              return (
                <PaginationItem key={item.key}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }

            const isCurrent = item.page === currentPage;

            return (
              <PaginationItem
                key={item.page}
                className={item.isSibling ? "hidden sm:inline-flex" : undefined}
              >
                <PaginationLink
                  href={createPageURL(item.page)}
                  isActive={isCurrent}
                >
                  {item.page}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          <PaginationItem>
            <PaginationNext
              href={hasNext ? createPageURL(currentPage + 1) : undefined}
              className={!hasNext ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <p className="text-xs text-muted-foreground sm:hidden">
        Сторінка {currentPage} з {totalPages}
      </p>
    </div>
  );
};
