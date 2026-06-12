"use client";

import { useEffect, useState } from "react";

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

  const debouncedValue = useDebouncedValue(value, 500);

  useEffect(() => {
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

    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedValue, pathname, router]);

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
