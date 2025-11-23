export enum NoteType {
  WHITE = 'WHITE',
  BLACK = 'BLACK'
}

export interface NoteData {
  note: string; // e.g., "C4", "C#4"
  octave: number;
  frequency: number;
  midi: number; // MIDI note number (A0 = 21)
  type: NoteType;
  index: number; // 0-87
  label?: string; // e.g., "C4"
}

export interface AudioSettings {
  volume: number; // 0.0 to 1.0
  decay: number; // seconds (release time)
}