import type { GuitarFrets } from "../types/chords";
import { soundingNotes } from "./guitarChords";

export function chordFrequencies(frets: GuitarFrets, capoFret = 0): number[] {
  return soundingNotes(frets).map(
    (note) => 440 * 2 ** ((note + capoFret - 69) / 12),
  );
}

let context: AudioContext | undefined;
let stopCurrent: (() => void) | undefined;

// Created only by a user gesture; one shared context avoids browser context limits.
export function createChordPlayback(
  frets: GuitarFrets,
  capoFret: number,
  onEnd: () => void,
) {
  stopCurrent?.();
  const audio = (context ??= new AudioContext());
  const oscillators: OscillatorNode[] = [];
  const nodes: AudioNode[] = [];
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    for (const oscillator of oscillators) oscillator.stop();
    for (const node of nodes) node.disconnect();
    if (stopCurrent === stop) stopCurrent = undefined;
    onEnd();
  };
  stopCurrent = stop;
  return {
    stop,
    async start() {
      try {
        await audio.resume();
        if (stopped) return;
        const frequencies = chordFrequencies(frets, capoFret);
        if (!frequencies.length) {
          stop();
          return;
        }
        const wave = audio.createPeriodicWave(
          new Float32Array(8),
          new Float32Array([0, 1, 0.5, 0.28, 0.15, 0.09, 0.05, 0.025]),
        );
        frequencies.forEach((frequency, index) => {
          const start = audio.currentTime + 0.02 + index * 0.045;
          const oscillator = audio.createOscillator();
          const filter = audio.createBiquadFilter();
          const gain = audio.createGain();
          oscillator.setPeriodicWave(wave);
          oscillator.frequency.value = frequency;
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(
            Math.min(frequency * 8, 12000),
            start,
          );
          filter.frequency.exponentialRampToValueAtTime(
            frequency * 1.5,
            start + 2.5,
          );
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(
            0.45 / frequencies.length,
            start + 0.004,
          );
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.5);
          gain.gain.linearRampToValueAtTime(0, start + 2.7);
          oscillator.connect(filter).connect(gain).connect(audio.destination);
          oscillators.push(oscillator);
          nodes.push(oscillator, filter, gain);
          oscillator.start(start);
          oscillator.stop(start + 2.8);
        });
        timer = setTimeout(stop, 3100);
      } catch (error) {
        stop();
        throw error;
      }
    },
  };
}
