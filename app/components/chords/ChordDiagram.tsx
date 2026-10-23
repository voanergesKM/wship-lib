import type { GuitarVoicing } from "@/utils/guitarChords";

export function ChordDiagram({ voicing, name }: { voicing: GuitarVoicing; name: string }) {
  const { frets } = voicing;
  const pressed = frets.filter((fret) => fret > 0);
  const firstFret = Math.max(...frets) <= 5 ? 1 : Math.min(...pressed);
  const labels = ["E", "A", "D", "G", "B", "e"];
  const description = frets.map((fret, i) => `${labels[i]}: ${fret < 0 ? "не грати" : fret === 0 ? "відкрита" : `лад ${fret}`}`).join(", ");

  return (
    <svg viewBox="0 0 200 220" className="mx-auto w-48 max-w-full text-foreground" role="img" aria-label={`${name}. ${description}`}>
      <title>{name}</title>
      {[0, 1, 2, 3, 4, 5].map((fret) => (
        <line key={fret} x1="40" x2="165" y1={40 + fret * 28} y2={40 + fret * 28} stroke="currentColor" strokeWidth={fret === 0 && firstFret === 1 ? 4 : 1} />
      ))}
      <text x="22" y="59" textAnchor="middle" fontSize="12" fill="currentColor">{firstFret}</text>
      {voicing.barres?.map((barre, i) => (
        <line key={`barre-${i}`} x1={40 + (6 - barre.fromString) * 25} x2={40 + (6 - barre.toString) * 25} y1={54 + (barre.fret - firstFret) * 28} y2={54 + (barre.fret - firstFret) * 28} stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
      ))}
      {frets.map((fret, string) => {
        const x = 40 + string * 25;
        return (
          <g key={string}>
            <line x1={x} x2={x} y1="40" y2="180" stroke="currentColor" />
            <text x={x} y="205" textAnchor="middle" fontSize="12" fill="currentColor">{labels[string]}</text>
            {fret <= 0 ? (
              <text x={x} y="26" textAnchor="middle" fontSize="16" fill="currentColor">{fret < 0 ? "×" : "○"}</text>
            ) : (
              <>
                <circle cx={x} cy={54 + (fret - firstFret) * 28} r="8" fill="currentColor" />
                {!!voicing.fingers?.[string] && <text x={x} y={58 + (fret - firstFret) * 28} textAnchor="middle" fontSize="11" fill="var(--background)">{voicing.fingers[string]}</text>}
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
