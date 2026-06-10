import { songsService } from "@/services/songs.service";
import { QueryFunctionContext, queryOptions } from "@tanstack/react-query";

export const songsListOptions = ({ page = 1, limit = 10, search = "" }) =>
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
