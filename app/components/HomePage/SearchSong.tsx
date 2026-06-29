"use client";

import { useEffect, useRef, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Search } from "lucide-react";

import { useDebouncedValue } from "@/hooks/useDebounce";
import { FieldInput } from "../shared/FieldInput";

export const SearchSong = () => {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const searchQuery = searchParams.get("search") ?? "";

  const [value, setValue] = useState(searchQuery);

  const previousSearchQueryRef = useRef(searchQuery);

  const isSyncingFromUrlRef = useRef(false);

  const debouncedValue = useDebouncedValue(value, 500);

  useEffect(() => {
    if (previousSearchQueryRef.current === searchQuery) {
      return;
    }

    previousSearchQueryRef.current = searchQuery;
    isSyncingFromUrlRef.current = true;
    setValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (isSyncingFromUrlRef.current) {
      if (debouncedValue === searchQuery) {
        isSyncingFromUrlRef.current = false;
      }

      return;
    }

    const current = searchParams.get("search") ?? "";

    if (current === debouncedValue) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (debouncedValue.trim()) {
      params.set("search", debouncedValue);
    } else {
      params.delete("search");
    }

    params.set("page", "1");

    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedValue, pathname, router, searchParams, searchQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isSyncingFromUrlRef.current = false;
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
