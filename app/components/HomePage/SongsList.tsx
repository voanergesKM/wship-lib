"use client";

import { useSongsList } from "@/hooks/useSongsList";
import { useAuth } from "../providers/AuthContext";

import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import Link from "next/link";

export const SongsList = () => {
  const { data, isLoadingSongs } = useSongsList();

  if (isLoadingSongs) {
    return <div>Loading...</div>;
  }

  // if (error) {
  //   return <div>Error: {error.message}</div>;
  // }

  if (!data?.data || data.data.length === 0) {
    return <div>No songs found</div>;
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-[auto,1fr,auto] gap-4 items-center">
      {data?.data.map((song) => (
        <li key={song._id.toString()}>
          <Link href={`/songs/${song.slug}`}>
            <Item variant="outline">
              <ItemContent>
                <ItemTitle>{song.title}</ItemTitle>
                <ItemDescription>{song.tags?.join(", ")}</ItemDescription>
              </ItemContent>
              {/* <ItemActions>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/songs/${song.slug}`}>Переглянути</Link>
                </Button>
              </ItemActions> */}
            </Item>
          </Link>
        </li>
      ))}
    </ul>
  );
};
