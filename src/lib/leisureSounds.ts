/**
 * Sons courts générés dans le navigateur.
 * Aucun fichier externe, aucun journal, aucun appel réseau.
 */

let audio: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audio) audio = new Ctx();
  return audio;
}

export function unlockLeisureAudio(): void {
  const current = context();
  if (current?.state === 'suspended') void current.resume();
}

function tone(frequency: number, start: number, duration: number, type: OscillatorType, volume: number): void {
  const current = context();
  if (!current) return;
  const osc = current.createOscillator();
  const amp = current.createGain();
  const when = current.currentTime + start;
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, when);
  amp.gain.setValueAtTime(0.0001, when);
  amp.gain.exponentialRampToValueAtTime(volume, when + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(amp);
  amp.connect(current.destination);
  osc.start(when);
  osc.stop(when + duration + 0.02);
}

export function playCountdownTick(): void {
  try {
    tone(740, 0, 0.05, 'square', 0.035);
  } catch {
    /* Le son ne doit jamais bloquer le jeu. */
  }
}

export function playCorrectChime(): void {
  try {
    tone(523.25, 0, 0.12, 'sine', 0.07);
    tone(659.25, 0.09, 0.14, 'sine', 0.07);
    tone(783.99, 0.18, 0.2, 'sine', 0.06);
  } catch {
    /* ignore */
  }
}

export function playWrongTone(): void {
  try {
    tone(311.13, 0, 0.13, 'triangle', 0.05);
    tone(233.08, 0.11, 0.18, 'triangle', 0.045);
  } catch {
    /* ignore */
  }
}
