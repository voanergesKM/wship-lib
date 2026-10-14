"use client";

import { useSearchParams } from "next/navigation";
import { useSongsList } from "@/hooks/useSongsList";
import { ResponsivePagination } from "../shared/ResponsivePagination";

export interface SongsPaginationProps {
  currentPage?: number;
  totalPages?: number;
  className?: string;
}

export const SongsPagination = ({
  currentPage: propPage,
  totalPages: propTotalPages,
  className,
}: SongsPaginationProps) => {
  const { data, page: hookPage } = useSongsList();
  const searchParams = useSearchParams();

  const currentPage = propPage ?? hookPage;
  const totalPages = propTotalPages ?? data?.pagination?.pages ?? 1;

  if (totalPages <= 1) {
    return null;
  }

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `?${params.toString()}`;
  };

  return (
    <ResponsivePagination
      currentPage={currentPage}
      totalPages={totalPages}
      createPageURL={createPageURL}
      className={className}
    />
  );
};
