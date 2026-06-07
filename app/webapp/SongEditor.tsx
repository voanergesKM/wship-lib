"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = { value?: string; onChange: (value: string) => void };

export function SongEditor({ value, onChange }: Props) {
  return (
    <>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Введіть текст пісні...\n\n[C]This is a chord\nThis is a lyric"
        className="w-full min-w-[800px] h-[500px] p-4 border rounded-xl font-mono text-lg resize-none leading-relaxed focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 outline-none"
      />
    </>
  );
}
