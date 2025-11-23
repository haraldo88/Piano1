import React from 'react';
import { NoteData, NoteType } from '../types';

interface PianoKeyProps {
  data: NoteData;
  isActive: boolean;
  onPress: (index: number) => void;
  onRelease: (index: number) => void;
}

export const PianoKey: React.FC<PianoKeyProps> = React.memo(({ data, isActive, onPress, onRelease }) => {
  const isBlack = data.type === NoteType.BLACK;

  // Touch handlers that prevent default to stop scrolling interference during a direct press
  // However, we rely on the container overflow for scrolling, so we need to be careful.
  // We pass events up to the parent logic usually, but here we trigger simple callbacks.
  
  const handlePointerDown = (e: React.PointerEvent) => {
    // We do NOT prevent default here immediately if we want to allow scrolling start?
    // Actually, for a piano, instantaneous feedback is key.
    // If we preventDefault, we kill the scroll.
    // Strategy: Let the parent logic handle the distinction or let the browser handle standard scroll.
    // To make "scroll vs play" work natively:
    // If the user TAPS, it plays. If the user DRAGS, it scrolls.
    // On touch devices, 'pointerdown' fires immediately.
    
    // We will capture pointer to ensure we get the 'up' event even if finger moves off key
    (e.target as Element).setPointerCapture(e.pointerId);
    onPress(data.index);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    onRelease(data.index);
  };

  const handlePointerEnter = (e: React.PointerEvent) => {
    // For glissando (slide to play), we check if a primary button is pressed
    if (e.buttons === 1) {
       onPress(data.index);
    }
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (isActive) {
      onRelease(data.index);
    }
  };

  // Styles
  const baseClasses = "relative flex-shrink-0 select-none transition-transform duration-75 ease-out rounded-b-md";
  
  // Dimensions tailored for iPhone 16 viewport width (~390-400px)
  // We want ~10 white keys visible. 390 / 10 = ~39px width per white key.
  const whiteKeyClasses = `
    h-64 w-[42px] z-0 border-r border-gray-300
    ${isActive 
      ? 'bg-gray-200 shadow-key-white-active scale-[0.98] origin-top' 
      : 'bg-piano-white shadow-key-white'}
  `;

  const blackKeyClasses = `
    absolute h-40 w-[24px] z-10 -ml-[12px]
    ${isActive 
      ? 'bg-gray-800 shadow-key-black-active scale-[0.98] origin-top' 
      : 'bg-piano-black shadow-key-black'}
  `;

  // Label positioning
  const label = data.label && !isBlack ? (
    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 pointer-events-none">
      {data.label}
    </span>
  ) : null;

  if (isBlack) {
    // Black keys are absolute positioned wrappers. They don't take up flex flow space.
    // But in a flex rendering, usually black keys are children of white keys or placed in a grid.
    // A better approach for flex:
    // Render white keys as the flex items.
    // If a white key is followed by a black key, render the black key absolute relative to the RIGHT of the white key.
    // Wait, the standard "margin-left negative" approach works if we render them sequentially.
    return (
        <div
            className={`${baseClasses} ${blackKeyClasses}`}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onPointerEnter={handlePointerEnter} // Only works if we aren't scrolling
        />
    );
  }

  return (
    <div
      className={`${baseClasses} ${whiteKeyClasses}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={handlePointerEnter}
    >
      {label}
    </div>
  );
});