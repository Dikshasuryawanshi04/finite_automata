import React, { useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  FastForward,
  ChevronsRight,
} from 'lucide-react';

interface StepControlsProps {
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onReset: () => void;
  onShowFinalDFA: () => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
}

export const StepControls: React.FC<StepControlsProps> = ({
  currentStepIndex,
  totalSteps,
  isPlaying,
  onTogglePlay,
  onPrevStep,
  onNextStep,
  onReset,
  onShowFinalDFA,
  playbackSpeed,
  onChangeSpeed,
}) => {
  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrevStep();
      } else if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNextStep, onPrevStep, onTogglePlay, onReset]);

  const canPrev = currentStepIndex > 0;
  const canNext = currentStepIndex < totalSteps - 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200/80 px-4 py-3 shadow-xs">
      {/* Left: Step Count & Quick Reset */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Reset to Step 0 (Press R)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <div className="text-xs font-mono font-bold text-slate-700">
          Step <span className="text-indigo-600">{currentStepIndex + 1}</span> / {totalSteps}
        </div>
      </div>

      {/* Center: Playback Navigation Controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPrevStep}
          disabled={!canPrev}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            canPrev
              ? 'border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              : 'border-slate-100 text-slate-300 cursor-not-allowed'
          }`}
          title="Previous Step (Left Arrow)"
        >
          <SkipBack className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs"
          title="Play / Pause (Space)"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Auto Play</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onNextStep}
          disabled={!canNext}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            canNext
              ? 'border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              : 'border-slate-100 text-slate-300 cursor-not-allowed'
          }`}
          title="Next Step (Right Arrow)"
        >
          <span className="hidden sm:inline">Next</span>
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Speed & Final DFA button */}
      <div className="flex items-center gap-2">
        {/* Playback Speed Toggles */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-xs">
          {[0.5, 1, 2].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onChangeSpeed(spd)}
              className={`px-2 py-1 rounded-md font-mono text-[11px] font-semibold transition-colors ${
                playbackSpeed === spd
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onShowFinalDFA}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 text-xs font-bold transition-colors"
          title="Jump to the final minimized state"
        >
          <ChevronsRight className="w-3.5 h-3.5 text-emerald-600" />
          <span>Show Final DFA</span>
        </button>
      </div>
    </div>
  );
};
