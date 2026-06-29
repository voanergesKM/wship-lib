"use client";

import { useSearchParams } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";
import { songsListOptions } from "@/lib/queries/songQueries";

const DEFAULT_PAGE_SIZE = 18;

export const useSongsList = () => {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const limitFromParams = Number(searchParams.get("limit"));
  const limit = limitFromParams || DEFAULT_PAGE_SIZE;
  const search = searchParams.get("search") || "";

  const {
    data,
    isLoading: isLoadingSongs,
    error: songsError,
  } = useSuspenseQuery(songsListOptions({ page, limit, search }));

  return { data, isLoadingSongs, songsError, page, limit, search };
};
