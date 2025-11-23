import React from 'react';
import { Volume2, Music2 } from 'lucide-react';
import { AudioSettings } from '../types';

interface ControlsProps {
  settings: AudioSettings;
  onUpdate: (s: Partial<AudioSettings>) => void;
}

export const Controls: React.FC<ControlsProps> = ({ settings, onUpdate }) => {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-50 shadow-lg text-white">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <Music2 size={20} className="text-white" />
        </div>
        <h1 className="font-bold text-lg tracking-tight">Harald's</h1>
        <span className="text-xs text-gray-400 -ml-1 sm:inline-block">piano</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Volume Slider */}
        <div className="flex items-center gap-2 bg-gray-800 rounded-full px-3 py-1.5">
          <Volume2 size={16} className="text-gray-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.volume}
            onChange={(e) => onUpdate({ volume: parseFloat(e.target.value) })}
            className="w-24 accent-indigo-500 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};