"use client";

import { useEffect, useRef, useState } from "react";
import { Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GuitarFrets } from "@/types/chords";
import { createChordPlayback } from "@/utils/chordAudio";

export function ChordAudioButton({ frets, name, capoFret = 0 }: { frets: GuitarFrets; name: string; capoFret?: number }) {
  // Reset playback when the selected shape, transposition or capo changes.
  return <PlaybackButton key={`${frets.join(",")}:${capoFret}`} frets={frets} name={name} capoFret={capoFret} />;
}

function PlaybackButton({ frets, name, capoFret }: { frets: GuitarFrets; name: string; capoFret: number }) {
  const stop = useRef<(() => void) | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => () => stop.current?.(), []);

  async function toggle() {
    if (playing) { stop.current?.(); return; }
    setError(false);
    try {
      const playback = createChordPlayback(frets, capoFret, () => setPlaying(false));
      stop.current = playback.stop;
      setPlaying(true);
      await playback.start();
    } catch {
      setPlaying(false);
      setError(true);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" variant="outline" size="sm" onClick={toggle} disabled={frets.every((fret) => fret < 0)} aria-label={`${playing ? "Зупинити" : "Послухати"} ${name}`}>
        {playing ? <Square data-icon="inline-start" /> : <Volume2 data-icon="inline-start" />}
        {playing ? "Зупинити" : "Послухати"}
      </Button>
      {error && <p role="alert" className="text-xs text-destructive">Не вдалося відтворити звук. Спробуйте ще раз або відкрийте в іншому браузері.</p>}
    </div>
  );
}
