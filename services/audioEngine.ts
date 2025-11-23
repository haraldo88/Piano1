import { AudioSettings, NoteData } from '../types';

// Salamander Grand Piano Samples (MIT License via Tone.js)
const BASE_URL = 'https://tonejs.github.io/audio/salamander/';
const SAMPLE_MAP: Record<string, string> = {
  'A0': 'A0.mp3', 'C1': 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3', 'A1': 'A1.mp3',
  'C2': 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3', 'A2': 'A2.mp3',
  'C3': 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3', 'A3': 'A3.mp3',
  'C4': 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', 'A4': 'A4.mp3',
  'C5': 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', 'A5': 'A5.mp3',
  'C6': 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3', 'A6': 'A6.mp3',
  'C7': 'C7.mp3', 'D#7': 'Ds7.mp3', 'F#7': 'Fs7.mp3', 'A7': 'A7.mp3',
  'C8': 'C8.mp3'
};

// Map note names to MIDI numbers for easier lookup in the sampler
const NOTE_TO_MIDI: Record<string, number> = {
  'A0': 21, 'C1': 24, 'D#1': 27, 'F#1': 30, 'A1': 33,
  'C2': 36, 'D#2': 39, 'F#2': 42, 'A2': 45,
  'C3': 48, 'D#3': 51, 'F#3': 54, 'A3': 57,
  'C4': 60, 'D#4': 63, 'F#4': 66, 'A4': 69,
  'C5': 72, 'D#5': 75, 'F#5': 78, 'A5': 81,
  'C6': 84, 'D#6': 87, 'F#6': 90, 'A6': 93,
  'C7': 96, 'D#7': 99, 'F#7': 102, 'A7': 105,
  'C8': 108
};

export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  // Map MIDI number to AudioBuffer
  private buffers: Map<number, AudioBuffer> = new Map();
  private activeSources: Map<number, { source: AudioBufferSourceNode; gain: GainNode }> = new Map();
  private settings: AudioSettings = {
    volume: 1.0,
    decay: 0.3 // Release time
  };
  private loadingPromise: Promise<void> | null = null;

  constructor() {
    // Lazy init
  }

  public init() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass();
      
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.settings.volume;
      this.masterGain.connect(this.context.destination);

      // Start loading samples immediately upon first interaction/init
      this.loadSamples();
    }
    
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  private async loadSamples() {
    if (this.loadingPromise) return this.loadingPromise;

    console.log('Starting sample load...');
    const promises = Object.entries(SAMPLE_MAP).map(async ([noteName, filename]) => {
      try {
        const response = await fetch(`${BASE_URL}${filename}`);
        if (!response.ok) throw new Error(`Fetch error: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        
        if (this.context) {
          const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
          const midi = NOTE_TO_MIDI[noteName];
          if (midi) {
            this.buffers.set(midi, audioBuffer);
          }
        }
      } catch (e) {
        console.warn(`Failed to load sample for ${noteName}:`, e);
      }
    });

    this.loadingPromise = Promise.all(promises).then(() => {
      console.log('All samples loaded');
    });
    
    return this.loadingPromise;
  }

  private getClosestBuffer(midi: number): { buffer: AudioBuffer, distance: number } | null {
    if (this.buffers.has(midi)) {
      return { buffer: this.buffers.get(midi)!, distance: 0 };
    }

    let closestMidi = -1;
    let minDistance = Infinity;

    for (const key of this.buffers.keys()) {
      const distance = Math.abs(midi - key);
      if (distance < minDistance) {
        minDistance = distance;
        closestMidi = key;
      }
    }

    if (closestMidi !== -1) {
      return { 
        buffer: this.buffers.get(closestMidi)!, 
        distance: midi - closestMidi 
      };
    }

    return null;
  }

  public updateSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (this.masterGain && newSettings.volume !== undefined) {
      this.masterGain.gain.setTargetAtTime(this.settings.volume, this.context?.currentTime || 0, 0.1);
    }
  }

  public playNote(note: NoteData) {
    if (!this.context || !this.masterGain) this.init();
    if (!this.context || !this.masterGain) return;

    // Stop existing note if playing
    this.stopNote(note.index);

    const match = this.getClosestBuffer(note.midi);
    
    // Fallback to simple oscillator if samples aren't loaded yet
    if (!match) {
      this.playSynthFallback(note.frequency, note.index);
      return;
    }

    const { buffer, distance } = match;
    const now = this.context.currentTime;
    
    const source = this.context.createBufferSource();
    const noteGain = this.context.createGain();

    source.buffer = buffer;
    // Pitch shift: 2^(semitones/12)
    source.playbackRate.value = Math.pow(2, distance / 12);

    // Attack: Immediate for percussive piano feel
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(1, now + 0.005); // Very fast attack (5ms) to avoid click but keep transient

    source.connect(noteGain);
    noteGain.connect(this.masterGain);

    source.start(now);

    this.activeSources.set(note.index, { source, gain: noteGain });
  }

  private playSynthFallback(frequency: number, noteIndex: number) {
    if (!this.context || !this.masterGain) return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'triangle';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.5);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    this.activeSources.set(noteIndex, { source: osc as any, gain });
  }

  public stopNote(noteIndex: number) {
    if (!this.context) return;
    
    const active = this.activeSources.get(noteIndex);
    if (active) {
      const { source, gain } = active;
      const now = this.context.currentTime;
      
      // Release envelope
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      // Natural release
      gain.gain.exponentialRampToValueAtTime(0.001, now + this.settings.decay);
      
      source.stop(now + this.settings.decay + 0.1);
      
      // Cleanup
      this.activeSources.delete(noteIndex);
    }
  }

  public stopAll() {
    this.activeSources.forEach((_, key) => this.stopNote(key));
  }
}

export const audioEngine = new AudioEngine();