import { NoteData, NoteType } from '../types';

export const generateKeys = (): NoteData[] => {
  const keys: NoteData[] = [];
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Standard Piano starts at A0 (MIDI 21).
  // A0 is index 0.
  
  let currentKeyIndex = 0; // Visual index
  
  // A0 (27.5Hz), A#0, B0
  const initialNotes = ['A', 'A#', 'B'];
  initialNotes.forEach((name) => {
    const isBlack = name.includes('#');
    const semitonesFromA4 = currentKeyIndex - 48; 
    const frequency = 440 * Math.pow(2, semitonesFromA4 / 12);

    keys.push({
      note: `${name}0`,
      octave: 0,
      frequency,
      midi: currentKeyIndex + 21,
      type: isBlack ? NoteType.BLACK : NoteType.WHITE,
      index: currentKeyIndex,
      label: name === 'C' ? 'C0' : undefined
    });
    currentKeyIndex++;
  });

  // Octaves 1 through 7
  for (let oct = 1; oct <= 7; oct++) {
    noteNames.forEach((name) => {
      const isBlack = name.includes('#');
      const semitonesFromA4 = currentKeyIndex - 48;
      const frequency = 440 * Math.pow(2, semitonesFromA4 / 12);

      keys.push({
        note: `${name}${oct}`,
        octave: oct,
        frequency,
        midi: currentKeyIndex + 21,
        type: isBlack ? NoteType.BLACK : NoteType.WHITE,
        index: currentKeyIndex,
        label: name === 'C' ? `C${oct}` : undefined
      });
      currentKeyIndex++;
    });
  }

  // C8 (The final key)
  const c8Freq = 440 * Math.pow(2, (currentKeyIndex - 48) / 12);
  keys.push({
    note: 'C8',
    octave: 8,
    frequency: c8Freq,
    midi: currentKeyIndex + 21,
    type: NoteType.WHITE,
    index: currentKeyIndex,
    label: 'C8'
  });

  return keys;
};

export const PIANO_KEYS = generateKeys();