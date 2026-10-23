"use client";
import { useQuery } from "@tanstack/react-query";
import type { ChordCatalogData } from "@/types/chords";
export const chordCatalogKey = ["chordCatalog"];
export async function chordRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Не вдалося виконати запит");
  return result as T;
}
export function useChordCatalog() {
  return useQuery({ queryKey: chordCatalogKey, queryFn: ({ signal }) => chordRequest<ChordCatalogData>("/api/chords", { signal }), staleTime: 60_000 });
}
