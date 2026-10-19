import { songsService } from "@/services/songs.service";
import { QueryFunctionContext, queryOptions } from "@tanstack/react-query";

export const DEFAULT_PAGE_SIZE = 9;

export const songsListOptions = ({
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  search = "",
}) =>
  queryOptions({
    queryKey: ["songsList", page, limit, search],
    queryFn: async ({ signal }: QueryFunctionContext) =>
      songsService.getPaginatedSongsList(
        {
          page,
          limit,
          search,
        },
        signal,
      ),
  });

export const songOptions = ({ slug }: { slug: string }) =>
  queryOptions({
    queryKey: ["song", slug],
    queryFn: async ({ signal }: QueryFunctionContext) =>
      songsService.getSongBySlug(slug, signal),
  });
