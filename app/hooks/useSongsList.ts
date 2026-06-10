"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { songsListOptions } from "@/lib/queries/songQueries";

export const useSongsList = () => {
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const search = searchParams.get("search") || "";

  const {
    data,
    isLoading: isLoadingSongs,
    error: songsError,
  } = useQuery(songsListOptions({ page, limit, search }));

  return { data, isLoadingSongs, songsError, page };
};
