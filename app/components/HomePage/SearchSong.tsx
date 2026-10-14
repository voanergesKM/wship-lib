"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { useDebouncedValue } from "@/hooks/useDebounce";
import { FieldInput } from "../shared/FieldInput";

export const SearchSong = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("search") ?? "";

  // Local controlled value for the input; URL is the source of truth on mount.
  const [value, setValue] = useState(urlSearch);

  // Track the last search value pushed to the URL to distinguish internal
  // updates from external navigation (e.g. browser Back / Forward).
  const lastPushedSearchRef = useRef(urlSearch);

  const [, startTransition] = useTransition();

  const debouncedValue = useDebouncedValue(value, 400);

  // Sync state if URL search param changes from the outside (e.g. browser Back / Forward)
  useEffect(() => {
    if (urlSearch !== lastPushedSearchRef.current) {
      lastPushedSearchRef.current = urlSearch;
      setValue(urlSearch);
    }
  }, [urlSearch]);

  // Update the URL only when the debounced value changes
  useEffect(() => {
    const trimmed = debouncedValue.trim();
    const currentUrlSearch = searchParams.get("search") ?? "";

    if (trimmed === currentUrlSearch) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) {
      params.set("search", trimmed);
    } else {
      params.delete("search");
    }

    params.set("page", "1");
    lastPushedSearchRef.current = trimmed;

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [debouncedValue, pathname, router, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
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

