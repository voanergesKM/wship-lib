"use client";

import { useEffect, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Search } from "lucide-react";

import { Input } from "../ui/input";
import { useDebouncedValue } from "@/hooks/useDebounce";

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
    <div className="relative mx-auto my-4 w-full max-w-lg">
      <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-5 w-5" />

      <Input
        value={value}
        onChange={handleChange}
        type="text"
        placeholder="Пошук пісні"
        className="w-full pl-9"
      />
    </div>
  );
};
