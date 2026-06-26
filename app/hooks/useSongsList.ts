"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { songsListOptions } from "@/lib/queries/songQueries";
import { useMediaQuery } from "./useMediaQuery";

const MOBILE_TABLET_BREAKPOINT = 1024;
const DESKTOP_LIMIT = 18;
const MOBILE_LIMIT = 10;

export const useSongsList = () => {
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery(`(min-width: ${MOBILE_TABLET_BREAKPOINT}px)`);

  const page = Number(searchParams.get("page")) || 1;
  const limitFromParams = Number(searchParams.get("limit"));
  const limit = limitFromParams || (isDesktop ? DESKTOP_LIMIT : MOBILE_LIMIT);
  const search = searchParams.get("search") || "";

  const {
    data,
    isLoading: isLoadingSongs,
    error: songsError,
  } = useQuery(songsListOptions({ page, limit, search }));

  return { data, isLoadingSongs, songsError, page, limit };
};
