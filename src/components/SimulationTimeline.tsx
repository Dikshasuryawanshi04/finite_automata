import React from 'react';
import { SimulationStep } from '../types/dfa';
import { CheckCircle2, ChevronRight } from 'lucide-react';

interface SimulationTimelineProps {
  steps: SimulationStep[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
}

export const SimulationTimeline: React.FC<SimulationTimelineProps> = ({
  steps,
  currentStepIndex,
  onSelectStep,
}) => {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
          Algorithm Timeline
        </span>
        <span className="text-xs font-mono font-bold text-indigo-700">
          Step {currentStepIndex + 1} of {steps.length}
        </span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {steps.map((step, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isPast = idx < currentStepIndex;

          return (
            <React.Fragment key={idx}>
              <button
                type="button"
                onClick={() => onSelectStep(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : isPast
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200/70 border border-slate-200/60'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-100'
                }`}
              >
                {isPast ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      isCurrent
                        ? 'bg-white text-indigo-600'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </span>
                )}
                <span>{step.stageLabel}</span>
              </button>

              {idx < steps.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
