"use client";
import { useState } from "react";
import { SongEditor } from "./SongEditor";
import { SongPreview } from "./SongPreview";

const INITIAL = `## Приспів [D#]Хто гріх і темінь перемагає [G#]Хто нас незмінно безмежно любить [Cm]Господь могутній, [A#]Ти над царями — Цар`;

export default function Page() {
  const [content, setContent] = useState(INITIAL);
  const [showChords, setShowChords] = useState(true);
  const [fontSize, setFontSize] = useState(24);

  return (
    <main className="flex flex-col p-6 md:flex-row">
      <div className="space-y-4">
        <SongEditor value={content} onChange={setContent} />
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowChords((prev) => !prev)}
            className="border rounded px-3 py-2"
          >
            Toggle chords
          </button>
          <button
            onClick={() => setFontSize((prev) => prev + 2)}
            className="border rounded px-3 py-2"
          >
            A+
          </button>
          <button
            onClick={() => setFontSize((prev) => prev - 2)}
            className="border rounded px-3 py-2"
          >
            A-
          </button>
        </div>
        <SongPreview
          content={content}
          showChords={showChords}
          fontSize={fontSize}
          chordColor="#facc15"
        />
      </div>
    </main>
  );
}
