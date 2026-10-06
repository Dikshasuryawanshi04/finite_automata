import React, { useState } from 'react';
import { SimulationStep, DFA, DistinguishabilityResult } from '../types/dfa';
import { explainStatePair } from '../utils/dfaMinimizer';
import { BookOpen, HelpCircle, Check, X, ArrowRight, Lightbulb } from 'lucide-react';

interface EducationalExplanationPanelProps {
  currentStep: SimulationStep;
  allSteps: SimulationStep[];
  dfa: DFA;
  selectedStateA: string | null;
  selectedStateB: string | null;
  onSelectStateA: (state: string) => void;
  onSelectStateB: (state: string) => void;
}

export const EducationalExplanationPanel: React.FC<EducationalExplanationPanelProps> = ({
  currentStep,
  allSteps,
  dfa,
  selectedStateA,
  selectedStateB,
  onSelectStateA,
  onSelectStateB,
}) => {
  // Pair inspector states: fallback to first two states if null
  const stateA = selectedStateA || dfa.states[0] || 'q0';
  const stateB = selectedStateB || dfa.states[1] || dfa.states[0] || 'q1';

  const pairResult: DistinguishabilityResult = explainStatePair(stateA, stateB, dfa, allSteps);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-5 shadow-xs">
      {/* "What is happening?" Educational Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-indigo-700">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold tracking-tight">What is happening?</h3>
        </div>

        <div className="space-y-2 text-xs leading-relaxed text-slate-700">
          <p className="font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            {currentStep.shortExplanation}
          </p>
          <p className="text-slate-600 pl-1">
            {currentStep.detailedExplanation}
          </p>
        </div>

        {currentStep.keyTakeaway && (
          <div className="flex items-start gap-2 p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-indigo-900">
            <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-indigo-950">Key Intuition: </span>
              <span className="text-indigo-800">{currentStep.keyTakeaway}</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Pairwise State Equivalence Tester */}
      <div className="border-t border-slate-100 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>State Pair Equivalence Inspector</span>
          </div>
          <span className="text-[11px] text-slate-500">Click states or select below</span>
        </div>

        {/* Pair Dropdowns */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">State 1</label>
            <select
              value={stateA}
              onChange={(e) => onSelectStateA(e.target.value)}
              className="w-full text-xs font-mono font-medium px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              {dfa.states.map((s) => (
                <option key={`a-${s}`} value={s}>
                  {s} {dfa.acceptStates.includes(s) ? '(*)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">State 2</label>
            <select
              value={stateB}
              onChange={(e) => onSelectStateB(e.target.value)}
              className="w-full text-xs font-mono font-medium px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              {dfa.states.map((s) => (
                <option key={`b-${s}`} value={s}>
                  {s} {dfa.acceptStates.includes(s) ? '(*)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pair Result Banner */}
        <div
          className={`p-3 rounded-lg border text-xs space-y-2 transition-all ${
            pairResult.areEquivalent
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/80 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span className="font-mono text-sm">
              ({stateA}, {stateB})
            </span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] uppercase tracking-wide font-semibold">
              {pairResult.areEquivalent ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-emerald-700">Equivalent (p ≈ q)</span>
                </>
              ) : (
                <>
                  <X className="w-3.5 h-3.5 text-rose-700" />
                  <span className="text-rose-700">Distinguishable</span>
                </>
              )}
            </div>
          </div>

          <div className="text-xs leading-relaxed whitespace-pre-line text-slate-700 font-sans">
            {pairResult.explanation}
          </div>

          {pairResult.witnessString && (
            <div className="text-[11px] font-mono text-slate-600 pt-1 border-t border-rose-200/60 flex items-center gap-1.5">
              <span>Distinguishing string witness:</span>
              <span className="font-bold text-rose-800 bg-white px-1.5 py-0.5 rounded border border-rose-200">
                w = "{pairResult.witnessString}"
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
