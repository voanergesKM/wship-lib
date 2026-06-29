"use client";

import { useSongsList } from "@/hooks/useSongsList";
import { SongItem } from "./SongItem";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useSearchParams } from "next/navigation";
import { SongsSearchEmptyState } from "./SongsSearchEmptyState";

export const SongsList = () => {
  const { data, page, search } = useSongsList();
  const searchParams = useSearchParams();

  if (!data?.data || data.data.length === 0) {
    return <SongsSearchEmptyState searchQuery={search} />;
  }

  const totalPages = data?.pagination?.pages || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.data.map((song) => (
          <li key={song._id.toString()}>
            <SongItem song={song} />
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={page > 1 ? createPageURL(page - 1) : undefined}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNumber = i + 1;
              const showPage =
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= page - 1 && pageNumber <= page + 1);

              if (!showPage) {
                if (pageNumber === page - 2 || pageNumber === page + 2) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              }

              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href={createPageURL(pageNumber)}
                    isActive={pageNumber === page}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                href={page < totalPages ? createPageURL(page + 1) : undefined}
                className={
                  page === totalPages ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};
