"use client";

import { useTransition, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Search } from "lucide-react";

import { useDebouncedValue } from "@/hooks/useDebounce";
import { FieldInput } from "../shared/FieldInput";

export const SearchSong = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local controlled value for the input; URL is the source of truth on mount.
  const [value, setValue] = useState(searchParams.get("search") ?? "");

  const [, startTransition] = useTransition();

  const debouncedValue = useDebouncedValue(value, 500);

  // Keep local input in sync when the URL param changes from outside
  // (e.g., browser Back / Forward).  We only overwrite when the URL param
  // diverges from the debounced value so we don't interrupt mid-typing.
  const urlSearch = searchParams.get("search") ?? "";
  if (urlSearch !== debouncedValue && urlSearch !== value) {
    setValue(urlSearch);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);

    // Schedule the URL update as a non-urgent transition so it doesn't block input.
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      const debounced = next.trim();

      if (debounced) {
        params.set("search", debounced);
      } else {
        params.delete("search");
      }

      params.set("page", "1");
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <FieldInput
      id="search-song"
      value={value}
      onChange={handleChange}
      placeholder="Пошук"
      className="w-full max-w-xl"
      startAdornment={<Search className="w-4 h-4" />}
      description="Введіть назву пісні, автора або тег"
    />
  );
};
