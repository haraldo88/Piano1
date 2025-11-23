import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PIANO_KEYS } from './utils/noteUtils';
import { audioEngine } from './services/audioEngine';
import { PianoKey } from './components/PianoKey';
import { Controls } from './components/Controls';
import { AudioSettings, NoteType } from './types';

function App() {
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    volume: 1.0,
    decay: 1.5
  });
  
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasInitializedAudio = useRef(false);

  // Initialize Audio Engine on first interaction
  const initAudio = () => {
    if (!hasInitializedAudio.current) {
      audioEngine.init();
      hasInitializedAudio.current = true;
    }
  };

  const updateAudioSettings = (newSettings: Partial<AudioSettings>) => {
    setAudioSettings(prev => ({ ...prev, ...newSettings }));
    audioEngine.updateSettings(newSettings);
  };

  const handleNotePress = useCallback((index: number) => {
    initAudio();

    if (isScrollingRef.current) return;

    const keyData = PIANO_KEYS.find(k => k.index === index);
    if (keyData) {
      // Pass the full keyData to use MIDI number for sampling
      audioEngine.playNote(keyData);
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.add(index);
        return next;
      });
    }
  }, []);

  const handleNoteRelease = useCallback((index: number) => {
    audioEngine.stopNote(index);
    setActiveKeys(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, []);

  const handleScroll = () => {
    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  };

  // Scroll to Middle C (C4) on mount with robust calculation
  useEffect(() => {
    const scrollToMiddleC = () => {
      if (scrollContainerRef.current) {
        // Find C4
        const middleCIndex = PIANO_KEYS.findIndex(k => k.note === 'C4');
        
        // Count ONLY white keys before C4 to calculate pixel distance
        // C4 is index 39 (starting from A0=0)
        const whiteKeysBefore = PIANO_KEYS.filter(k => k.index < middleCIndex && k.type === NoteType.WHITE).length;
        
        // Key Width: 42px. 
        // Half Key (to center): 21px.
        // Screen padding-left is 50vw, meaning x=0 puts the start of the list at the center.
        // We want the CENTER of C4 to be at the center of the screen.
        // We need to shift LEFT by: (Width of all keys before C4) + (Half width of C4).
        
        const scrollPos = (whiteKeysBefore * 42) + 21;
        
        scrollContainerRef.current.scrollTo({
          left: scrollPos,
          behavior: 'instant' 
        });
      }
    };

    // Use requestAnimationFrame to ensure layout is ready
    let rafId: number;
    let attempts = 0;
    
    const attemptScroll = () => {
        if (scrollContainerRef.current && scrollContainerRef.current.scrollWidth > 1000) {
            scrollToMiddleC();
        } else if (attempts < 20) { // Try for ~300ms
            attempts++;
            rafId = requestAnimationFrame(attemptScroll);
        }
    };
    
    // Initial delay to allow CSS width calculation
    const t = setTimeout(() => {
        rafId = requestAnimationFrame(attemptScroll);
    }, 50);

    return () => {
        clearTimeout(t);
        cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="h-screen w-full bg-neutral-900 overflow-hidden flex flex-col">
      <Controls settings={audioSettings} onUpdate={updateAudioSettings} />

      <div className="flex-grow flex items-center justify-center relative bg-neutral-900">
        
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-neutral-900 to-black opacity-50 pointer-events-none" />
        <div className="absolute top-1/4 left-0 w-full text-center text-gray-600 font-mono text-xs pointer-events-none animate-pulse">
           &larr; Scroll to explore 88 keys &rarr;
        </div>

        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="relative w-full max-w-full overflow-x-auto overflow-y-hidden no-scrollbar pb-12 pt-12"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x'
          }}
        >
          <div className="inline-flex px-[50vw]">
            {PIANO_KEYS.map((key, i) => {
              if (key.type === NoteType.BLACK) return null;

              const nextKey = PIANO_KEYS[i + 1];
              const hasBlackKeyAfter = nextKey && nextKey.type === NoteType.BLACK;

              return (
                <div key={key.note} className="relative flex flex-col justify-start">
                   <PianoKey 
                     data={key} 
                     isActive={activeKeys.has(key.index)}
                     onPress={handleNotePress}
                     onRelease={handleNoteRelease}
                   />
                   
                   {hasBlackKeyAfter && (
                     <div className="absolute left-full top-0 z-20 pointer-events-auto">
                        <PianoKey 
                          data={nextKey}
                          isActive={activeKeys.has(nextKey.index)}
                          onPress={handleNotePress}
                          onRelease={handleNoteRelease}
                        />
                     </div>
                   )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;